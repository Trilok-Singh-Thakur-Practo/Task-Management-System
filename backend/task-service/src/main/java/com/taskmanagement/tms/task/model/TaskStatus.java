package com.taskmanagement.tms.task.model;

/**
 * Enum representing the possible statuses of a task.
 */
public enum TaskStatus {
    TODO,       // Task that needs to be done
    IN_PROGRESS, // Task that is currently being worked on
    DONE,       // Task that has been completed
    BLOCKER     // Task that is blocked and cannot proceed
} 