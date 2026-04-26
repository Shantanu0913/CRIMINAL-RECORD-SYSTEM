DROP DATABASE IF EXISTS Criminal_Record_System_2;
CREATE DATABASE Criminal_Record_System_2;
USE Criminal_Record_System_2;

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    password VARCHAR(100)
);

CREATE TABLE Admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    office VARCHAR(100),
    contact VARCHAR(15),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Police_Station (
    station_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100),
    contact_no VARCHAR(15)
);

CREATE TABLE Police_Officer (
    officer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    badge_no VARCHAR(50),
    rank_1 VARCHAR(50),
    station_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (station_id) REFERENCES Police_Station(station_id)
);

CREATE TABLE FIR (
    fir_id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE,
    time TIME,
    description TEXT,
    officer_id INT,
    station_id INT,
    FOREIGN KEY (officer_id) REFERENCES Police_Officer(officer_id),
    FOREIGN KEY (station_id) REFERENCES Police_Station(station_id)
);

CREATE TABLE Criminal (
    criminal_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    gender VARCHAR(10),
    address VARCHAR(200),
    remarks TEXT
);

CREATE TABLE FIR_Criminal (
    fir_id INT,
    criminal_id INT,
    PRIMARY KEY (fir_id, criminal_id),
    FOREIGN KEY (fir_id) REFERENCES FIR(fir_id),
    FOREIGN KEY (criminal_id) REFERENCES Criminal(criminal_id)
);

CREATE TABLE Criminal_Record (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    criminal_id INT,
    previous_offence TEXT,
    remarks TEXT,
    FOREIGN KEY (criminal_id) REFERENCES Criminal(criminal_id)
);

CREATE TABLE Court (
    court_id INT AUTO_INCREMENT PRIMARY KEY,
    court_name VARCHAR(100),
    judge_name VARCHAR(100),
    location VARCHAR(100)
);

CREATE TABLE Court_Clerk (
    clerk_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    court_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (court_id) REFERENCES Court(court_id)
);

CREATE TABLE Case_File (
    case_id INT AUTO_INCREMENT PRIMARY KEY,
    fir_id INT,
    court_id INT,
    case_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50),
    remarks TEXT,
    FOREIGN KEY (fir_id) REFERENCES FIR(fir_id),
    FOREIGN KEY (court_id) REFERENCES Court(court_id)
);

CREATE TABLE Evidence (
    evidence_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT,
    description TEXT,
    type VARCHAR(50),
    date_collected DATE,
    FOREIGN KEY (case_id) REFERENCES Case_File(case_id)
);

CREATE TABLE Hearing (
    hearing_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT,
    hearing_date DATE,
    hearing_time TIME,
    judge_remarks TEXT,
    next_date DATE,
    status VARCHAR(50) DEFAULT 'Scheduled',
    FOREIGN KEY (case_id) REFERENCES Case_File(case_id)
);

-- USERS (admin user has email=123, password=456)
INSERT INTO Users VALUES
(1,'Mohd Siraj','siraj@police.gov','9871110001','pass'),
(2,'Rakesh Sharma','rakesh@police.gov','9871110002','pass'),
(3,'Anita Deshmukh','anita@police.gov','9871110003','pass'),
(4,'Karan Patel','karan@police.gov','9871110004','pass'),
(5,'Vikram Singh','vikram@police.gov','9871110005','pass'),
(6,'Admin User','123','9871110006','456'),
(7,'Rajendra Verma','clerk@1.gov','9871110007','pass'),
(8,'Sita Ram','clerk@2.gov','9871110008','pass'),
(9,'Gopal Krishnan','clerk@3.gov','9871110009','pass');

-- ADMIN
INSERT INTO Admin VALUES (1,6,'Head Office','9871110006');

-- POLICE STATION
INSERT INTO Police_Station VALUES
(1,'Central Police Station','Mumbai','9000011111'),
(2,'Andheri Police Station','Mumbai','9000011112'),
(3,'Dadar Police Station','Mumbai','9000011113');

-- POLICE OFFICERS
INSERT INTO Police_Officer VALUES
(101,1,'DSP101','DSP',1),
(102,2,'INS102','Inspector',1),
(103,3,'INS103','Inspector',2),
(104,4,'SI104','Sub Inspector',2),
(105,5,'SI105','Sub Inspector',3);

-- COURTS
INSERT INTO Court VALUES
(1,'Mumbai District Court','Judge R Mehta','Mumbai'),
(2,'Sessions Court','Judge S Kulkarni','Mumbai'),
(3,'High Court Bench','Judge A Desai','Mumbai');

-- COURT CLERKS
INSERT INTO Court_Clerk VALUES
(1, 7, 1),
(2, 8, 2),
(3, 9, 3);

-- CRIMINALS
INSERT INTO Criminal VALUES
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
(31,'Pinky Mane','Male','Pune','overspeeding without helmet and triple seat on two wheeler');

-- CRIMINAL RECORDS
INSERT INTO Criminal_Record VALUES
(1,1,'Fraud case 2021','Under investigation'),
(2,2,'Robbery case 2022','Repeat offender'),
(3,3,'Bike theft','First offence'),
(4,4,'Online scam','Under investigation'),
(5,5,'Bank fraud','Repeat offender');

-- FIR
INSERT INTO FIR VALUES
(1,'2025-03-01','10:30:00','Bank fraud complaint',102,1),
(2,'2025-03-02','12:10:00','Robbery in market',103,2),
(3,'2025-03-03','14:45:00','Cyber fraud case',101,1),
(4,'2025-03-05','09:20:00','Drug trafficking report',105,3),
(5,'2025-03-06','16:30:00','Street assault',104,2);

-- FIR_CRIMINAL
INSERT INTO FIR_Criminal VALUES
(1,1),(1,5),(2,2),(2,7),(3,4),(3,20),(4,18),(5,22);

-- CASE FILES
INSERT INTO Case_File VALUES
(1,1,1,'Fraud','2025-03-05',NULL,'Pending','Accused found at scene'),
(2,2,2,'Robbery','2025-03-06',NULL,'Pending','Multiple witnesses available'),
(3,3,1,'Cyber Crime','2025-03-07',NULL,'Investigation','Forensic analysis ongoing'),
(4,4,3,'Drug Case','2025-03-08',NULL,'Pending','Large quantity seized'),
(5,5,2,'Assault','2025-03-09',NULL,'Pending','Victim hospitalised');

-- EVIDENCE
INSERT INTO Evidence VALUES
(1,1,'Bank transaction records','Document','2025-03-05'),
(2,2,'CCTV footage from market','Video','2025-03-06'),
(3,3,'Laptop used for fraud','Digital','2025-03-07'),
(4,4,'Seized narcotics','Physical','2025-03-08'),
(5,5,'Medical report','Document','2025-03-09');

-- HEARINGS
INSERT INTO Hearing VALUES
(1,1,'2025-04-01','10:00:00','Bail application reviewed','2025-05-01','Completed'),
(2,1,'2025-05-01','10:00:00','Evidence presented by prosecution','2025-06-01','Completed'),
(3,2,'2025-04-10','11:30:00','Witness testimony recorded','2025-05-10','Completed'),
(4,3,'2025-04-15','09:00:00','Forensic report submitted','2025-05-15','Completed'),
(5,4,'2025-04-20','14:00:00','Charge sheet filed',NULL,'Scheduled'),
(6,5,'2025-05-01','11:00:00','First hearing scheduled',NULL,'Scheduled');
