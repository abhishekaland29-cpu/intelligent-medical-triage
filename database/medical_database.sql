create database medical_db;
use medical_db;

CREATE TABLE triage_queue (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255),
    symptoms VARCHAR(255),
    pain_level INT,
    priority INT,
    ai_reason TEXT,
    status VARCHAR(50),
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

select*from triage_queue;