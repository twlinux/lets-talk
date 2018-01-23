CREATE TABLE People (
    User_name  varchar(32)    NOT NULL,
    Pass       varchar(255)   NOT NULL,
    Bio        varchar(4095),
    PRIMARY KEY (User_name)
);

CREATE TABLE Story (
    ID        int NOT NULL   AUTO_INCREMENT,
    Author    varchar(32),
    PostDate  TIMESTAMP,
    Content   varchar(4095)  NOT NULL,
    PRIMARY KEY (ID)
);

INSERT INTO People (User_name, Pass, Bio)
VALUES ('Jennings Zhang', 'tanIg3', 'I can eat a whole pizza in one sitting.');
INSERT INTO People (User_name, Pass)
VALUES ('Caroline Reynolds', 'vocOt3');
INSERT INTO People (User_name, Pass)
VALUES ('Austin Long', 'DuAwm4');

INSERT INTO Story (Author, Content, PostDate)
VALUES 
    ('Austin Long', 'Jennings stop this', '2018-01-16 15:40:12'),
    ('Caroline Reynolds', 'Yayy!', '2018-01-17 11:11:31'),
    ('Jennings Zhang', 'Visual Studio Code is the best IDE.', '2018-01-17 15:49:43');
