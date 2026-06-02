-- ============================================================
--  AI Voice Interviewer Pro — MySQL Schema
--  Compatible with: AWS RDS MySQL 8.0+
--  Run this ONCE on your RDS instance before starting the app
-- ============================================================
--  Usage:
--    mysql -h your-rds-endpoint.rds.amazonaws.com \
--          -u admin -p voice_interviewer < schema.sql
--
--  Or via MySQL Workbench / DBeaver:
--    Connect to RDS → Open SQL Editor → Run this file
-- ============================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `voice_interviewer`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `voice_interviewer`;

-- ============================================================
-- TABLE 1: sessions
-- Stores each interview session per candidate
-- ============================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `session_token`    VARCHAR(64)     NOT NULL UNIQUE COMMENT 'UUID used by frontend to identify session',
  `candidate_name`   VARCHAR(120)    DEFAULT NULL,
  `role`             ENUM(
                       'devops',
                       'fullstack',
                       'dataanalyst',
                       'cybersecurity',
                       'cloud'
                     ) NOT NULL,
  `level`            ENUM(
                       'fresher',
                       'mid',
                       'senior'
                     ) NOT NULL,
  `status`           ENUM(
                       'active',
                       'completed',
                       'abandoned'
                     ) NOT NULL DEFAULT 'active',
  `total_questions`  TINYINT UNSIGNED NOT NULL DEFAULT 7,
  `answered_count`   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `correct_count`    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `partial_count`    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `wrong_count`      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `score_percentage` DECIMAL(5,2)    NOT NULL DEFAULT 0.00 COMMENT '0.00 to 100.00',
  `duration_seconds` INT UNSIGNED    DEFAULT NULL COMMENT 'Total time taken for the interview',
  `ip_address`       VARCHAR(45)     DEFAULT NULL COMMENT 'IPv4 or IPv6',
  `user_agent`       TEXT            DEFAULT NULL,
  `completed_at`     DATETIME        DEFAULT NULL,
  `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE  KEY `uq_session_token`       (`session_token`),
  INDEX   `idx_sessions_role`          (`role`),
  INDEX   `idx_sessions_level`         (`level`),
  INDEX   `idx_sessions_status`        (`status`),
  INDEX   `idx_sessions_score`         (`score_percentage`),
  INDEX   `idx_sessions_role_level`    (`role`, `level`),
  INDEX   `idx_sessions_created_at`    (`created_at`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='One row per interview session';


-- ============================================================
-- TABLE 2: questions
-- Stores each AI-generated question linked to a session
-- ============================================================
CREATE TABLE IF NOT EXISTS `questions` (
  `id`                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `session_id`          INT UNSIGNED  NOT NULL,
  `question_number`     TINYINT UNSIGNED NOT NULL COMMENT '1 to 7',
  `topic`               VARCHAR(120)  NOT NULL,
  `difficulty`          ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  `question_text`       TEXT          NOT NULL,
  `expected_keywords`   JSON          DEFAULT NULL COMMENT 'Array of expected keyword strings',
  `ideal_answer_points` TEXT          DEFAULT NULL COMMENT 'Key points for a strong answer',
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_questions_session_id`      (`session_id`),
  INDEX `idx_questions_question_number` (`question_number`),
  INDEX `idx_questions_topic`           (`topic`),
  INDEX `idx_questions_difficulty`      (`difficulty`),

  CONSTRAINT `fk_questions_session`
    FOREIGN KEY (`session_id`)
    REFERENCES `sessions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='AI-generated questions per session';


-- ============================================================
-- TABLE 3: answers
-- Stores spoken answers with full AI grading details
-- ============================================================
CREATE TABLE IF NOT EXISTS `answers` (
  `id`                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id`              INT UNSIGNED NOT NULL,
  `question_id`             INT UNSIGNED NOT NULL,
  `transcript`              TEXT         NOT NULL COMMENT 'Whisper-transcribed spoken answer',
  `verdict`                 ENUM('correct','partial','wrong') NOT NULL,
  `score`                   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0 to 100',
  `score_reason`            TEXT         DEFAULT NULL COMMENT 'One-sentence verdict explanation',
  `what_was_right`          TEXT         DEFAULT NULL,
  `what_was_missing`        TEXT         DEFAULT NULL,
  `correct_answer_summary`  TEXT         DEFAULT NULL COMMENT 'Model answer explained by AI',
  `spoken_feedback`         TEXT         DEFAULT NULL COMMENT 'Text that was spoken back to candidate',
  `improvement_tip`         TEXT         DEFAULT NULL,
  `duration_ms`             INT UNSIGNED DEFAULT NULL COMMENT 'Time taken to answer in milliseconds',
  `created_at`              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_answer_per_question` (`question_id`) COMMENT 'One answer per question',
  INDEX `idx_answers_session_id`   (`session_id`),
  INDEX `idx_answers_question_id`  (`question_id`),
  INDEX `idx_answers_verdict`      (`verdict`),
  INDEX `idx_answers_score`        (`score`),

  CONSTRAINT `fk_answers_session`
    FOREIGN KEY (`session_id`)
    REFERENCES `sessions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_answers_question`
    FOREIGN KEY (`question_id`)
    REFERENCES `questions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Candidate spoken answers + full AI grading';


-- ============================================================
-- TABLE 4: leaderboard
-- Denormalized top scores for fast leaderboard queries
-- Written when a session is marked completed
-- ============================================================
CREATE TABLE IF NOT EXISTS `leaderboard` (
  `id`               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `session_id`       INT UNSIGNED    NOT NULL UNIQUE COMMENT 'One leaderboard row per session',
  `candidate_name`   VARCHAR(120)    NOT NULL,
  `role`             ENUM(
                       'devops',
                       'fullstack',
                       'dataanalyst',
                       'cybersecurity',
                       'cloud'
                     ) NOT NULL,
  `level`            ENUM(
                       'fresher',
                       'mid',
                       'senior'
                     ) NOT NULL,
  `correct_count`    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `partial_count`    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `total_questions`  TINYINT UNSIGNED NOT NULL DEFAULT 7,
  `score_percentage` DECIMAL(5,2)    NOT NULL,
  `duration_seconds` INT UNSIGNED    DEFAULT NULL,
  `completed_at`     DATETIME        NOT NULL,
  `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY  `uq_leaderboard_session`        (`session_id`),
  INDEX       `idx_lb_role`                   (`role`),
  INDEX       `idx_lb_level`                  (`level`),
  INDEX       `idx_lb_score`                  (`score_percentage` DESC),
  INDEX       `idx_lb_role_level_score`        (`role`, `level`, `score_percentage` DESC),
  INDEX       `idx_lb_completed_at`           (`completed_at`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Denormalized leaderboard — written on session completion';


-- ============================================================
-- VIEW 1: v_leaderboard_ranked
-- Top scores with RANK() per role+level combination
-- ============================================================
CREATE OR REPLACE VIEW `v_leaderboard_ranked` AS
SELECT
  l.id,
  l.candidate_name,
  l.role,
  l.level,
  l.correct_count,
  l.partial_count,
  l.total_questions,
  l.score_percentage,
  l.duration_seconds,
  l.completed_at,
  RANK() OVER (
    PARTITION BY l.role, l.level
    ORDER BY l.score_percentage DESC, l.duration_seconds ASC
  ) AS rank_in_role_level,
  RANK() OVER (
    PARTITION BY l.role
    ORDER BY l.score_percentage DESC, l.duration_seconds ASC
  ) AS rank_in_role,
  RANK() OVER (
    ORDER BY l.score_percentage DESC, l.duration_seconds ASC
  ) AS rank_overall
FROM leaderboard l;


-- ============================================================
-- VIEW 2: v_session_summary
-- Full session with question count and answer stats
-- ============================================================
CREATE OR REPLACE VIEW `v_session_summary` AS
SELECT
  s.id,
  s.session_token,
  s.candidate_name,
  s.role,
  s.level,
  s.status,
  s.total_questions,
  s.answered_count,
  s.correct_count,
  s.partial_count,
  s.wrong_count,
  s.score_percentage,
  s.duration_seconds,
  s.completed_at,
  s.created_at,
  COUNT(q.id)                                          AS questions_generated,
  COUNT(a.id)                                          AS answers_submitted,
  ROUND(AVG(a.score), 1)                               AS avg_answer_score,
  ROUND(AVG(a.duration_ms) / 1000, 1)                  AS avg_answer_seconds
FROM sessions s
LEFT JOIN questions q ON q.session_id = s.id
LEFT JOIN answers  a ON a.session_id  = s.id
GROUP BY s.id;


-- ============================================================
-- VIEW 3: v_role_stats
-- Aggregate performance stats per role
-- ============================================================
CREATE OR REPLACE VIEW `v_role_stats` AS
SELECT
  role,
  COUNT(*)                                              AS total_sessions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END)     AS completed_sessions,
  ROUND(AVG(CASE WHEN status='completed'
    THEN score_percentage END), 1)                      AS avg_score,
  MAX(CASE WHEN status = 'completed'
    THEN score_percentage END)                          AS highest_score,
  MIN(CASE WHEN status = 'completed'
    THEN score_percentage END)                          AS lowest_score,
  COUNT(CASE WHEN status='completed'
    AND level='fresher' THEN 1 END)                     AS fresher_count,
  COUNT(CASE WHEN status='completed'
    AND level='mid'     THEN 1 END)                     AS mid_count,
  COUNT(CASE WHEN status='completed'
    AND level='senior'  THEN 1 END)                     AS senior_count
FROM sessions
GROUP BY role;


-- ============================================================
-- STORED PROCEDURE: sp_complete_session
-- Finalizes a session: calculates score, marks complete,
-- writes to leaderboard (if candidate has a name)
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS `sp_complete_session`(
  IN  p_session_token   VARCHAR(64),
  IN  p_duration_sec    INT,
  OUT p_score_pct       DECIMAL(5,2),
  OUT p_session_id      INT
)
BEGIN
  DECLARE v_id            INT;
  DECLARE v_correct       INT;
  DECLARE v_partial       INT;
  DECLARE v_total         INT;
  DECLARE v_name          VARCHAR(120);
  DECLARE v_role          VARCHAR(30);
  DECLARE v_level         VARCHAR(10);
  DECLARE v_score         DECIMAL(5,2);

  -- Fetch session
  SELECT id, correct_count, partial_count, total_questions,
         candidate_name, role, level
  INTO   v_id, v_correct, v_partial, v_total, v_name, v_role, v_level
  FROM   sessions
  WHERE  session_token = p_session_token
  LIMIT  1;

  IF v_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Session not found';
  END IF;

  -- Calculate weighted score
  SET v_score = ROUND(((v_correct + v_partial * 0.5) / v_total) * 100, 2);

  -- Mark session completed
  UPDATE sessions
  SET    status           = 'completed',
         score_percentage = v_score,
         duration_seconds = p_duration_sec,
         completed_at     = NOW(),
         updated_at       = NOW()
  WHERE  id = v_id;

  -- Write to leaderboard (only named candidates)
  IF v_name IS NOT NULL AND v_name != '' THEN
    INSERT INTO leaderboard (
      session_id, candidate_name, role, level,
      correct_count, partial_count, total_questions,
      score_percentage, duration_seconds, completed_at
    ) VALUES (
      v_id, v_name, v_role, v_level,
      v_correct, v_partial, v_total,
      v_score, p_duration_sec, NOW()
    )
    AS new_lb
    ON DUPLICATE KEY UPDATE
      score_percentage = new_lb.score_percentage,
      duration_seconds = new_lb.duration_seconds,
      completed_at     = new_lb.completed_at,
      updated_at       = NOW();
  END IF;

  SET p_score_pct  = v_score;
  SET p_session_id = v_id;
END$$

DELIMITER ;


-- ============================================================
-- STORED PROCEDURE: sp_get_leaderboard
-- Returns ranked leaderboard with optional role/level filter
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS `sp_get_leaderboard`(
  IN p_role  VARCHAR(30),   -- NULL or 'all' = no filter
  IN p_level VARCHAR(10),   -- NULL or 'all' = no filter
  IN p_limit INT            -- number of rows, default 50
)
BEGIN
  SET p_limit = IFNULL(p_limit, 50);

  SELECT
    l.id,
    l.candidate_name,
    l.role,
    l.level,
    l.correct_count,
    l.partial_count,
    l.total_questions,
    l.score_percentage,
    l.duration_seconds,
    l.completed_at,
    RANK() OVER (
      ORDER BY l.score_percentage DESC, l.duration_seconds ASC
    ) AS rank_overall
  FROM leaderboard l
  WHERE (p_role  IS NULL OR p_role  = 'all' OR l.role  = p_role)
    AND (p_level IS NULL OR p_level = 'all' OR l.level = p_level)
  ORDER BY l.score_percentage DESC, l.duration_seconds ASC
  LIMIT p_limit;
END$$

DELIMITER ;


-- ============================================================
-- STORED PROCEDURE: sp_cleanup_abandoned
-- Marks sessions abandoned if active for more than 2 hours
-- (run periodically via AWS Lambda or cron)
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS `sp_cleanup_abandoned`()
BEGIN
  UPDATE sessions
  SET    status     = 'abandoned',
         updated_at = NOW()
  WHERE  status     = 'active'
    AND  created_at < NOW() - INTERVAL 2 HOUR;

  SELECT ROW_COUNT() AS abandoned_count;
END$$

DELIMITER ;


-- ============================================================
-- SAMPLE QUERIES (reference)
-- ============================================================

/*
-- Top 10 all-time leaderboard:
SELECT candidate_name, role, level, score_percentage, duration_seconds, completed_at
FROM   v_leaderboard_ranked
ORDER  BY rank_overall
LIMIT  10;

-- DevOps seniors only:
CALL sp_get_leaderboard('devops', 'senior', 20);

-- Role performance summary:
SELECT * FROM v_role_stats ORDER BY avg_score DESC;

-- Full session detail:
SELECT * FROM v_session_summary WHERE session_token = 'your-token-here';

-- Complete a session via SP:
CALL sp_complete_session('session-token-here', 480, @score, @sid);
SELECT @score AS final_score, @sid AS session_id;

-- Answer analysis for a session:
SELECT
  q.question_number,
  q.topic,
  q.difficulty,
  a.verdict,
  a.score,
  ROUND(a.duration_ms / 1000, 1) AS seconds_taken,
  a.improvement_tip
FROM questions q
JOIN answers   a ON a.question_id = q.id
JOIN sessions  s ON s.id = q.session_id
WHERE s.session_token = 'your-token-here'
ORDER BY q.question_number;

-- Cleanup stale sessions:
CALL sp_cleanup_abandoned();
*/

-- ============================================================
-- VERIFY INSTALLATION
-- ============================================================
SELECT 'sessions'    AS table_name, COUNT(*) AS row_count FROM sessions
UNION ALL
SELECT 'questions'   AS table_name, COUNT(*) AS row_count FROM questions
UNION ALL
SELECT 'answers'     AS table_name, COUNT(*) AS row_count FROM answers
UNION ALL
SELECT 'leaderboard' AS table_name, COUNT(*) AS row_count FROM leaderboard;

SELECT 'Schema installation complete' AS install_status;
