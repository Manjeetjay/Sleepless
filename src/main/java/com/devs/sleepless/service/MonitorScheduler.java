package com.devs.sleepless.service;

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

    private static final Logger log = LoggerFactory.getLogger(MonitorScheduler.class);

    private final TaskScheduler scheduler;
    private final MonitorExecutor executor;

    public void schedule(Monitor monitor) {
        log.info("[CRON] Scheduling monitor id={} | url={} | cron='{}'", monitor.getId(), monitor.getUrl(),
                monitor.getCronExpression());
        scheduler.schedule(
                () -> executor.execute(monitor),
                new CronTrigger(monitor.getCronExpression()));
    }
}
