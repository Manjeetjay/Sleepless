package com.devs.sleepless.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicIntegerArray;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.devs.sleepless.model.Monitor;
import com.devs.sleepless.repository.MonitorRepository;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CounterCacheService {

    private static final Logger log = LoggerFactory.getLogger(CounterCacheService.class);
    private static final int SUCCESS_IDX = 0;
    private static final int FAILURE_IDX = 1;

    private final MonitorRepository monitorRepository;

    // monitorId -> AtomicIntegerArray[successDelta, failureDelta]
    private final Map<Long, AtomicIntegerArray> deltas = new ConcurrentHashMap<>();

    private AtomicIntegerArray getOrCreate(Long monitorId) {
        return deltas.computeIfAbsent(monitorId, k -> new AtomicIntegerArray(2));
    }

    public void incrementSuccess(Long monitorId) {
        getOrCreate(monitorId).incrementAndGet(SUCCESS_IDX);
    }

    public void incrementFailure(Long monitorId) {
        getOrCreate(monitorId).incrementAndGet(FAILURE_IDX);
    }

    public int getSuccessDelta(Long monitorId) {
        AtomicIntegerArray arr = deltas.get(monitorId);
        return arr == null ? 0 : arr.get(SUCCESS_IDX);
    }

    public int getFailureDelta(Long monitorId) {
        AtomicIntegerArray arr = deltas.get(monitorId);
        return arr == null ? 0 : arr.get(FAILURE_IDX);
    }

    /**
     * Remove cached deltas for a monitor (e.g. when it is deleted).
     */
    public void evict(Long monitorId) {
        deltas.remove(monitorId);
    }

    /**
     * Flush all accumulated deltas to the database.
     * Runs once daily at midnight.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void flushToDb() {
        if (deltas.isEmpty()) {
            log.info("[CounterCache] Nothing to flush");
            return;
        }

        log.info("[CounterCache] Flushing {} monitor counter deltas to DB", deltas.size());

        for (Map.Entry<Long, AtomicIntegerArray> entry : deltas.entrySet()) {
            Long monitorId = entry.getKey();
            AtomicIntegerArray arr = entry.getValue();

            // Atomically read-and-reset each delta
            int successDelta = arr.getAndSet(SUCCESS_IDX, 0);
            int failureDelta = arr.getAndSet(FAILURE_IDX, 0);

            if (successDelta == 0 && failureDelta == 0) {
                continue;
            }

            try {
                monitorRepository.findById(monitorId).ifPresent(monitor -> {
                    monitor.setSuccessCount(monitor.getSuccessCount() + successDelta);
                    monitor.setFailureCount(monitor.getFailureCount() + failureDelta);
                    monitorRepository.save(monitor);
                    log.info("[CounterCache] Flushed monitor id={} | +{}S +{}F -> totalS={} totalF={}",
                            monitorId, successDelta, failureDelta,
                            monitor.getSuccessCount(), monitor.getFailureCount());
                });
            } catch (Exception e) {
                // Put deltas back so they aren't lost
                arr.addAndGet(SUCCESS_IDX, successDelta);
                arr.addAndGet(FAILURE_IDX, failureDelta);
                log.error("[CounterCache] Failed to flush monitor id={}: {}", monitorId, e.getMessage());
            }
        }
    }

    /**
     * Safety net: flush pending deltas on application shutdown.
     */
    @PreDestroy
    public void flushOnShutdown() {
        log.info("[CounterCache] Application shutting down — flushing pending counter deltas");
        flushToDb();
    }
}
