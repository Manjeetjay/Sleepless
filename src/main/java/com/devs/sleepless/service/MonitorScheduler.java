package com.devs.sleepless.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;

import com.devs.sleepless.model.Monitor;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MonitorScheduler {

    private final TaskScheduler scheduler;
    private final MonitorExecutor executor;
    private static final Logger log = LoggerFactory.getLogger(MonitorScheduler.class);

    // store running cron jobs
    private final Map<Long, ScheduledFuture<?>> jobs =
            new ConcurrentHashMap<>();

    // schedule cron
    public void schedule(Monitor monitor) {
        log.info("Scheduling monitor with ID: {}", monitor.getId());

        // prevent duplicate jobs
        cancel(monitor.getId());

        ScheduledFuture<?> future =
                scheduler.schedule(
                        () -> executor.execute(monitor),
                        new CronTrigger(monitor.getCronExpression())
                );

        jobs.put(monitor.getId(), future);
    }

    // cancel cron
    public void cancel(Long monitorId) {
        ScheduledFuture<?> future = jobs.remove(monitorId);
        if (future != null) {
            future.cancel(false);
        }
        log.info("Cancelled monitor with ID: {}", monitorId);
    }
}