package com.devs.sleepless.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.devs.sleepless.model.Monitor;

@Repository
public interface MonitorRepository extends JpaRepository<Monitor, Long> {
}
