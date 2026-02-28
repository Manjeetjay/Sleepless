package com.devs.sleepless.service;

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

    public void schedule(Monitor monitor) {
        scheduler.schedule(
                () -> executor.execute(monitor),
                new CronTrigger(monitor.getCronExpression()));
    }
}
