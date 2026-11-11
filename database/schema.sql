-- PART 1: DATABASE CREATION

DROP DATABASE IF EXISTS Criminal_Record_System_2;

CREATE DATABASE Criminal_Record_System_2;

USE Criminal_Record_System_2;

-- PART 2: TABLE CREATION 

-- 1. USERS TABLE
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    password VARCHAR(100)
);

-- 2. ADMIN TABLE
CREATE TABLE Admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    office VARCHAR(100),
    contact VARCHAR(15),

    FOREIGN KEY (user_id)
    REFERENCES Users(user_id)
);

-- 3. POLICE STATION TABLE
CREATE TABLE Police_Station (
    station_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100),
    contact_no VARCHAR(15)
);

-- 4. POLICE OFFICER TABLE
CREATE TABLE Police_Officer (
    officer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    badge_no VARCHAR(50),
    rank_1 VARCHAR(50),
    station_id INT,

    FOREIGN KEY (user_id)
    REFERENCES Users(user_id),

    FOREIGN KEY (station_id)
    REFERENCES Police_Station(station_id)
);

-- 5. FIR TABLE
CREATE TABLE FIR (
    fir_id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE,
    time TIME,
    description TEXT,
    officer_id INT,
    station_id INT,
    group_photo_url LONGTEXT,
    incident_location VARCHAR(255),

    fir_status VARCHAR(50)
    DEFAULT 'Under Investigation',

    severity_level VARCHAR(50)
    DEFAULT 'High',

    CONSTRAINT chk_fir_severity
    CHECK (severity_level IN ('Low', 'Medium', 'High', 'Critical')),

    CONSTRAINT chk_fir_status
    CHECK (
        fir_status IN (
            'Under Investigation',
            'Registered',
            'Closed',
            'Pending'
        )
    ),

    FOREIGN KEY (officer_id)
    REFERENCES Police_Officer(officer_id),

    FOREIGN KEY (station_id)
    REFERENCES Police_Station(station_id)
);

-- 6. CRIMINAL TABLE
CREATE TABLE Criminal (
    criminal_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    gender VARCHAR(10),
    address VARCHAR(200),
    remarks TEXT,
    photo_url LONGTEXT,

    face_enrolled BOOLEAN DEFAULT FALSE,
    face_enrolled_at DATETIME,

    fingerprint_data LONGTEXT,

    fingerprint_type VARCHAR(50)
    DEFAULT 'Right Thumb',

    fingerprint_quality INT DEFAULT 0,

    fingerprint_enrolled BOOLEAN DEFAULT FALSE,
    fingerprint_enrolled_at DATETIME,

    biometric_status VARCHAR(50)
    DEFAULT 'Pending',

    CONSTRAINT chk_fingerprint_quality
    CHECK (fingerprint_quality BETWEEN 0 AND 100)
);

-- 7. FIR_CRIMINAL TABLE
CREATE TABLE FIR_Criminal (
    fir_id INT,
    criminal_id INT,

    PRIMARY KEY (fir_id, criminal_id),

    FOREIGN KEY (fir_id)
    REFERENCES FIR(fir_id)
    ON DELETE CASCADE,

    FOREIGN KEY (criminal_id)
    REFERENCES Criminal(criminal_id)
    ON DELETE CASCADE
);

-- 8. CRIMINAL RECORD TABLE
CREATE TABLE Criminal_Record (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    criminal_id INT,
    previous_offence TEXT,
    remarks TEXT,

    FOREIGN KEY (criminal_id)
    REFERENCES Criminal(criminal_id)
    ON DELETE CASCADE
);

-- 9. COURT TABLE
CREATE TABLE Court (
    court_id INT AUTO_INCREMENT PRIMARY KEY,
    court_name VARCHAR(100),
    judge_name VARCHAR(100),
    location VARCHAR(100)
);

-- 10. COURT CLERK TABLE
CREATE TABLE Court_Clerk (
    clerk_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    court_id INT,

    FOREIGN KEY (user_id)
    REFERENCES Users(user_id),

    FOREIGN KEY (court_id)
    REFERENCES Court(court_id)
);

-- 11. CASE FILE TABLE
CREATE TABLE Case_File (
    case_id INT AUTO_INCREMENT PRIMARY KEY,
    fir_id INT,
    court_id INT,
    case_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50),
    remarks TEXT,

    FOREIGN KEY (fir_id)
    REFERENCES FIR(fir_id),

    FOREIGN KEY (court_id)
    REFERENCES Court(court_id)
);

-- 12. EVIDENCE TABLE
CREATE TABLE Evidence (
    evidence_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT,
    fir_id INT,
    description TEXT,
    type VARCHAR(50),
    file_url LONGTEXT,
    file_name VARCHAR(255),
    media_type VARCHAR(50),
    date_collected DATE,

    FOREIGN KEY (case_id)
    REFERENCES Case_File(case_id)
    ON DELETE CASCADE,

    FOREIGN KEY (fir_id)
    REFERENCES FIR(fir_id)
    ON DELETE CASCADE
);

-- 13. CRIMINAL MEDIA TABLE
CREATE TABLE Criminal_Media (
    media_id INT AUTO_INCREMENT PRIMARY KEY,
    criminal_id INT,

    media_type VARCHAR(50)
    DEFAULT 'Photo',

    file_url LONGTEXT,
    file_name VARCHAR(255),
    title VARCHAR(200),

    date_added DATETIME
    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criminal_id)
    REFERENCES Criminal(criminal_id)
    ON DELETE CASCADE
);

-- 14. HEARING TABLE
CREATE TABLE Hearing (
    hearing_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT,
    hearing_date DATE,
    hearing_time TIME,
    judge_remarks TEXT,
    next_date DATE,

    status VARCHAR(50)
    DEFAULT 'Scheduled',

    CONSTRAINT chk_hearing_status
    CHECK (
        status IN (
            'Scheduled',
            'Completed',
            'Adjourned',
            'Cancelled'
        )
    ),

    FOREIGN KEY (case_id)
    REFERENCES Case_File(case_id)
    ON DELETE CASCADE
);

-- PART 3: INSERT SAMPLE DATA

-- USERS
INSERT INTO Users VALUES
(1,'Mohd Siraj','siraj@police.gov','9871110001','pass'),
(2,'Rakesh Sharma','rakesh@police.gov','9871110002','pass'),
(3,'Anita Deshmukh','anita@police.gov','9871110003','pass'),
(4,'Karan Patel','karan@police.gov','9871110004','pass'),
(5,'Vikram Singh','vikram@police.gov','9871110005','pass'),
(6,'Admin User','123','9871110006','456'),
(7,'Rajendra Verma','clerk@1.gov','9871110007','pass'),
(8,'Sita Ram','clerk@2.gov','9871110008','pass'),
(9,'Gopal Krishnan','clerk@3.gov','9871110009','pass'),
(10,'SAM','shantxanu@gmail.com','8275400000','SAM'),
(11,'Officer User','officer@crms.com','9871110011','pass');

-- ADMIN
INSERT INTO Admin VALUES
(1,6,'Head Office','9871110006'),
(2,10,'HQ','8275400000');

-- POLICE STATIONS
INSERT INTO Police_Station VALUES
(1,'Central Police Station','Mumbai','9000011111'),
(2,'Andheri Police Station','Mumbai','9000011112'),
(3,'Dadar Police Station','Mumbai','9000011113');

-- POLICE OFFICERS
INSERT INTO Police_Officer VALUES
(100,10,'DSP100','DSP',1),
(101,1,'DSP101','DSP',1),
(102,2,'INS102','Inspector',1),
(103,3,'INS103','Inspector',2),
(104,4,'SI104','Sub Inspector',2),
(105,5,'SI105','Sub Inspector',3),
(106,11,'OFF106','Inspector',1);

-- COURTS
INSERT INTO Court VALUES
(1,'Mumbai District Court','Judge R Mehta','Mumbai'),
(2,'Sessions Court','Judge S Kulkarni','Mumbai'),
(3,'High Court Bench','Judge A Desai','Mumbai');

-- COURT CLERKS
INSERT INTO Court_Clerk VALUES
(1,7,1),
(2,8,2),
(3,9,3),
(4,10,1);

-- CRIMINALS
INSERT INTO Criminal
(criminal_id,name,gender,address,remarks)
VALUES

(1,'Prithviraj Hiray','Male','Pune','Fraud suspect'),
(2,'Aditya Gholasgaon','Male','Aurangabad','Robbery suspect'),
(3,'Rahul Patil','Male','Nashik','Theft'),
(4,'Aman Khan','Male','Mumbai','Cyber crime'),
(5,'Rohan Gupta','Male','Delhi','Fraud'),
(6,'Vikas Yadav','Male','Lucknow','Assault'),
(7,'Arjun Singh','Male','Jaipur','Robbery'),
(8,'Sahil Verma','Male','Chandigarh','Theft'),
(9,'Manish Sharma','Male','Delhi','Fraud'),
(10,'Rakesh Patel','Male','Ahmedabad','Assault'),
(11,'Deepak Jadhav','Male','Pune','Drug case'),
(12,'Sanjay More','Male','Kolhapur','Theft'),
(13,'Akash Thakur','Male','Nagpur','Cyber crime'),
(14,'Vivek Mishra','Male','Varanasi','Fraud'),
(15,'Kunal Shah','Male','Surat','Money laundering'),
(16,'Rajat Kapoor','Male','Delhi','Assault'),
(17,'Sameer Sheikh','Male','Mumbai','Robbery'),
(18,'Imran Shaikh','Male','Mumbai','Drug trafficking'),
(19,'Nitin Joshi','Male','Pune','Fraud'),
(20,'Harsh Mehta','Male','Ahmedabad','Cyber crime'),
(21,'Aditya Kulkarni','Male','Pune','Robbery'),
(22,'Rohit Pawar','Male','Satara','Assault'),
(23,'Ganesh Patil','Male','Nashik','Theft'),
(24,'Amit Chavan','Male','Kolhapur','Fraud'),
(25,'Suresh Naik','Male','Goa','Drug case'),
(26,'Anil Kumar','Male','Delhi','Cyber crime'),
(27,'Vijay Rao','Male','Hyderabad','Robbery'),
(28,'Sunil Reddy','Male','Hyderabad','Assault'),
(29,'Mahesh Babu','Male','Bangalore','Fraud'),
(30,'Raj Malhotra','Male','Delhi','Money laundering'),
(31,'Pinky Mane','Male','Pune',
'overspeeding without helmet and triple seat on two wheeler');

-- CRIMINAL RECORDS
INSERT INTO Criminal_Record VALUES
(1,1,'Fraud case 2021','Under investigation'),
(2,2,'Robbery case 2022','Repeat offender'),
(3,3,'Bike theft','First offence'),
(4,4,'Online scam','Under investigation'),
(5,5,'Bank fraud','Repeat offender');

-- FIR RECORDS
INSERT INTO FIR
(fir_id,date,time,description,officer_id,station_id)
VALUES
(1,'2025-03-01','10:30:00','Bank fraud complaint',102,1),
(2,'2025-03-02','12:10:00','Robbery in market',103,2),
(3,'2025-03-03','14:45:00','Cyber fraud case',101,1),
(4,'2025-03-05','09:20:00','Drug trafficking report',105,3),
(5,'2025-03-06','16:30:00','Street assault',104,2);

-- FIR CRIMINAL RELATIONSHIPS
INSERT INTO FIR_Criminal VALUES
(1,1),
(1,5),
(2,2),
(2,7),
(3,4),
(3,20),
(4,18),
(5,22);

-- CASE FILES
INSERT INTO Case_File VALUES
(1,1,1,'Fraud','2025-03-05',NULL,'Pending','Accused found at scene'),
(2,2,2,'Robbery','2025-03-06',NULL,'Pending','Multiple witnesses available'),
(3,3,1,'Cyber Crime','2025-03-07',NULL,'Investigation','Forensic analysis ongoing'),
(4,4,3,'Drug Case','2025-03-08',NULL,'Pending','Large quantity seized'),
(5,5,2,'Assault','2025-03-09',NULL,'Pending','Victim hospitalised');


-- EVIDENCE
INSERT INTO Evidence
(evidence_id,case_id,fir_id,description,type,date_collected)
VALUES
(1,1,1,'Bank transaction records','Document','2025-03-05'),
(2,2,2,'CCTV footage from market','Video','2025-03-06'),
(3,3,3,'Laptop used for fraud','Digital','2025-03-07'),
(4,4,4,'Seized narcotics','Physical','2025-03-08'),
(5,5,5,'Medical report','Document','2025-03-09');


-- HEARINGS
INSERT INTO Hearing VALUES
(1,1,'2025-04-01','10:00:00','Bail application reviewed','2025-05-01','Completed'),
(2,1,'2025-05-01','10:00:00','Evidence presented by prosecution','2025-06-01','Completed'),
(3,2,'2025-04-10','11:30:00','Witness testimony recorded','2025-05-10','Completed'),
(4,3,'2025-04-15','09:00:00','Forensic report submitted','2025-05-15','Completed'),
(5,4,'2025-04-20','14:00:00','Charge sheet filed',NULL,'Scheduled'),
(6,5,'2025-05-01','11:00:00','First hearing scheduled',NULL,'Scheduled');


-- PART 4: AUDIT TABLE

CREATE TABLE Criminal_Audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    criminal_id INT,
    action_type VARCHAR(20),
    action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);


-- PART 5: TRIGGERS

-- TRIGGER 1: AFTER INSERT ON CRIMINAL

DELIMITER //

CREATE TRIGGER after_criminal_insert
AFTER INSERT ON Criminal
FOR EACH ROW
BEGIN

    INSERT INTO Criminal_Audit
    (criminal_id,action_type,details)

    VALUES
    (
        NEW.criminal_id,
        'INSERT',
        CONCAT('New criminal added: ',NEW.name)
    );

END //

-- TRIGGER 2: AFTER UPDATE ON CRIMINAL

CREATE TRIGGER after_criminal_update
AFTER UPDATE ON Criminal
FOR EACH ROW
BEGIN

    INSERT INTO Criminal_Audit
    (criminal_id,action_type,details)

    VALUES
    (
        NEW.criminal_id,
        'UPDATE',
        CONCAT('Criminal record updated: ',NEW.name)
    );

END //

DELIMITER ;

-- PART 6: VIEWS

-- VIEW 1: CRIMINAL DETAILS

CREATE VIEW Criminal_Details AS

SELECT
    criminal_id,
    name,
    gender,
    address,
    remarks,
    biometric_status

FROM Criminal;

-- VIEW 2: FIR AND CRIMINAL DETAILS

CREATE VIEW FIR_Criminal_Details AS

SELECT
    f.fir_id,
    f.date,
    f.description,
    f.fir_status,
    c.criminal_id,
    c.name AS criminal_name

FROM FIR f

JOIN FIR_Criminal fc
ON f.fir_id = fc.fir_id

JOIN Criminal c
ON fc.criminal_id = c.criminal_id;

-- VIEW 3: CASE AND COURT DETAILS

CREATE VIEW Case_Court_Details AS

SELECT
    cf.case_id,
    cf.case_type,
    cf.status,
    f.fir_id,
    c.court_name,
    c.judge_name

FROM Case_File cf

LEFT JOIN FIR f
ON cf.fir_id = f.fir_id

LEFT JOIN Court c
ON cf.court_id = c.court_id;

-- VIEW 4: HEARING DETAILS

CREATE VIEW Hearing_Details AS

SELECT
    h.hearing_id,
    h.case_id,
    cf.case_type,
    h.hearing_date,
    h.hearing_time,
    h.next_date,
    h.status

FROM Hearing h

JOIN Case_File cf
ON h.case_id = cf.case_id;

-- PART 7: STORED PROCEDURES

-- PROCEDURE 1: SEARCH CRIMINAL BY ID

DELIMITER //

CREATE PROCEDURE GetCriminalByID(
    IN p_criminal_id INT
)
BEGIN

    SELECT *
    FROM Criminal
    WHERE criminal_id = p_criminal_id;

END //

-- PROCEDURE 2: UPDATE FIR STATUS

CREATE PROCEDURE UpdateFIRStatus(
    IN p_fir_id INT,
    IN p_status VARCHAR(50)
)
BEGIN

    UPDATE FIR
    SET fir_status = p_status
    WHERE fir_id = p_fir_id;

END //

-- PROCEDURE 3: SEARCH CASES BY STATUS

CREATE PROCEDURE GetCasesByStatus(
    IN p_status VARCHAR(50)
)
BEGIN

    SELECT
        case_id,
        fir_id,
        court_id,
        case_type,
        status,
        remarks

    FROM Case_File

    WHERE status = p_status;

END //

DELIMITER ;

-- PART 8: USER DEFINED FUNCTION

-- FUNCTION: COUNT FIRs ASSOCIATED WITH A CRIMINAL

DELIMITER //

CREATE FUNCTION CountCriminalFIRs(
    p_criminal_id INT
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN

    DECLARE total INT;

    SELECT COUNT(*)
    INTO total

    FROM FIR_Criminal

    WHERE criminal_id = p_criminal_id;

    RETURN total;

END //

DELIMITER ;


-- PART 9: INDEXES

CREATE INDEX idx_criminal_name
ON Criminal(name);

CREATE INDEX idx_fir_date
ON FIR(date);

CREATE INDEX idx_case_status
ON Case_File(status);

CREATE INDEX idx_hearing_date
ON Hearing(hearing_date);

CREATE INDEX idx_evidence_case
ON Evidence(case_id);


-- PART 10: ADVANCED SQL DEMONSTRATION QUERIES
-- ==========================================================

-- 1. DISPLAY ALL CRIMINALS

SELECT * FROM Criminal;

-- 2. DISPLAY ALL FIR RECORDS

SELECT * FROM FIR;

-- 3. DISPLAY FIR WITH CRIMINAL NAMES

SELECT
    f.fir_id,
    f.description,
    c.criminal_id,
    c.name

FROM FIR f

JOIN FIR_Criminal fc
ON f.fir_id = fc.fir_id

JOIN Criminal c
ON fc.criminal_id = c.criminal_id;

-- 4. COUNT TOTAL CRIMINALS

SELECT COUNT(*) AS total_criminals
FROM Criminal;

-- 5. DISPLAY PENDING CASES

SELECT *
FROM Case_File
WHERE status = 'Pending';

-- 6. DISPLAY CASES WITH COURT INFORMATION

SELECT *
FROM Case_Court_Details;

-- 7. DISPLAY HEARING DETAILS

SELECT *
FROM Hearing_Details;

-- 8. GROUP BY: COUNT CRIMINALS BY GENDER

SELECT
    gender,
    COUNT(*) AS total

FROM Criminal

GROUP BY gender;

-- 9. HAVING: FIND GROUPS WITH MORE THAN ONE RECORD

SELECT
    gender,
    COUNT(*) AS total

FROM Criminal

GROUP BY gender

HAVING COUNT(*) > 1;

-- 10. ORDER BY: SORT CRIMINALS BY NAME

SELECT *
FROM Criminal
ORDER BY name ASC;

-- 11. LEFT JOIN: DISPLAY ALL CRIMINALS
-- INCLUDING THOSE WITHOUT FIR RECORDS

SELECT
    c.criminal_id,
    c.name,
    fc.fir_id

FROM Criminal c

LEFT JOIN FIR_Criminal fc
ON c.criminal_id = fc.criminal_id;

-- 12. SUBQUERY: CRIMINALS ASSOCIATED WITH FIRs

SELECT *
FROM Criminal

WHERE criminal_id IN (
    SELECT criminal_id
    FROM FIR_Criminal
);

-- 13. FUNCTION CALL

SELECT
    name,
    CountCriminalFIRs(criminal_id) AS total_FIRs

FROM Criminal;

-- PART 11: TRANSACTION DEMONSTRATION

-- IMPORTANT:
-- Run this section separately when demonstrating.
-- COMMIT permanently saves the changes.
-- ROLLBACK cancels uncommitted changes.


-- TRANSACTION WITH COMMIT

-- START TRANSACTION;

-- UPDATE FIR
-- SET fir_status = 'Under Investigation'
-- WHERE fir_id = 1;

-- UPDATE Case_File
-- SET status = 'Investigation'
-- WHERE case_id = 1;

-- COMMIT;


-- TRANSACTION WITH ROLLBACK

-- START TRANSACTION;

-- UPDATE FIR
-- SET fir_status = 'Closed'
-- WHERE fir_id = 1;

-- ROLLBACK;


-- PART 12: TRIGGER TESTING
-- Run these separately to test triggers.

-- INSERT INTO Criminal
-- (name,gender,address,remarks)
-- VALUES
-- ('Test Criminal','Male','Mumbai','Trigger testing');

-- UPDATE Criminal
-- SET remarks = 'Updated remarks'
-- WHERE criminal_id = 1;

-- Check audit logs:

-- SELECT * FROM Criminal_Audit;


-- PART 13: ADVANCED SQL VERIFICATION
-- ==========================================================

-- CHECK ALL TABLES

SHOW TABLES;

-- CHECK TRIGGERS

SHOW TRIGGERS;

-- CHECK VIEWS

SHOW FULL TABLES
WHERE Table_type = 'VIEW';

-- CHECK STORED PROCEDURES

SHOW PROCEDURE STATUS
WHERE Db = 'Criminal_Record_System_2';

-- CHECK FUNCTIONS

SHOW FUNCTION STATUS
WHERE Db = 'Criminal_Record_System_2';

-- CHECK INDEXES

SHOW INDEX FROM Criminal;

-- CHECK DATABASE VERSION

SELECT VERSION();

-- END OF CRIMINAL RECORD MANAGEMENT SYSTEM
-- ==========================================================