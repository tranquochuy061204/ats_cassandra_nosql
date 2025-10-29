-- nosql.application_rounds_by_application definition

CREATE TABLE nosql.application_rounds_by_application (
    job_id uuid,
    candidate_id uuid,
    round_order smallint,
    feedback_html text,
    interviewer_id uuid,
    interviewer_name text,
    meet_link text,
    note text,
    round_name text,
    scheduled_at timestamp,
    score smallint,
    status text,
    updated_at timestamp,
    PRIMARY KEY ((job_id, candidate_id), round_order)
) WITH additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.applications_by_candidate definition

CREATE TABLE nosql.applications_by_candidate (
    candidate_id uuid,
    applied_at timestamp,
    job_id uuid,
    answers_json text,
    feedback_json text,
    status text,
    updated_at timestamp,
    PRIMARY KEY (candidate_id, applied_at, job_id)
) WITH CLUSTERING ORDER BY (applied_at DESC, job_id ASC)
    AND additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.applications_by_candidate_job definition

CREATE TABLE nosql.applications_by_candidate_job (
    candidate_id uuid,
    job_id uuid,
    applied_at timestamp,
    PRIMARY KEY ((candidate_id, job_id))
) WITH additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.applications_by_job definition

CREATE TABLE nosql.applications_by_job (
    job_id uuid,
    applied_at timestamp,
    candidate_id uuid,
    ai_match_result text,
    answers_json text,
    feedback_json text,
    status text,
    updated_at timestamp,
    PRIMARY KEY (job_id, applied_at, candidate_id)
) WITH CLUSTERING ORDER BY (applied_at DESC, candidate_id ASC)
    AND additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.applications_recent definition

CREATE TABLE nosql.applications_recent (
    recruiter_id uuid,
    applied_at timestamp,
    job_id uuid,
    candidate_id uuid,
    answers_json text,
    status text,
    PRIMARY KEY (recruiter_id, applied_at, job_id, candidate_id)
) WITH CLUSTERING ORDER BY (applied_at DESC, job_id ASC, candidate_id ASC)
    AND additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.districts definition

CREATE TABLE nosql.districts (
    province_code text,
    code text,
    name text,
    PRIMARY KEY (province_code, code)
) WITH additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.jobs_by_id definition

CREATE TABLE nosql.jobs_by_id (
    job_id uuid,
    address_line text,
    benefits text,
    created_at timestamp,
    deadline date,
    description_vi text,
    employment_type text,
    exp_years_min smallint,
    level text,
    probation_months smallint,
    province_code text,
    published_at timestamp,
    questions_json text,
    recruiter_id uuid,
    requirements_vi text,
    salary_gross boolean,
    salary_negotiable boolean,
    salary_vnd_max int,
    salary_vnd_min int,
    skills set<text>,
    status text,
    title_vi text,
    updated_at timestamp,
    visible boolean,
    work_type text,
    working_hours text,
    PRIMARY KEY (job_id)
) WITH additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.jobs_by_recruiter definition

CREATE TABLE nosql.jobs_by_recruiter (
    recruiter_id uuid,
    created_at timestamp,
    job_id uuid,
    status text,
    title_vi text,
    visible boolean,
    PRIMARY KEY (recruiter_id, created_at, job_id)
) WITH CLUSTERING ORDER BY (created_at DESC, job_id ASC)
    AND additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.jobs_by_status_visible definition

CREATE TABLE nosql.jobs_by_status_visible (
    status text,
    visible boolean,
    published_at timestamp,
    job_id uuid,
    address_line text,
    employment_type text,
    level text,
    province_code text,
    salary_gross boolean,
    salary_vnd_max int,
    salary_vnd_min int,
    title_vi text,
    work_type text,
    PRIMARY KEY ((status, visible), published_at, job_id)
) WITH CLUSTERING ORDER BY (published_at DESC, job_id ASC)
    AND additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.users_by_email definition

CREATE TABLE nosql.users_by_email (
    user_email text,
    user_id uuid,
    PRIMARY KEY (user_email)
) WITH additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.users_by_id definition

CREATE TABLE nosql.users_by_id (
    user_id uuid,
    address text,
    created_at timestamp,
    cv_url text,
    district_code text,
    full_name text,
    gender text,
    password_hash text,
    province_code text,
    role text,
    user_email text,
    PRIMARY KEY (user_id)
) WITH additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.users_by_role definition

CREATE TABLE nosql.users_by_role (
    role text,
    user_id uuid,
    email text,
    full_name text,
    PRIMARY KEY (role, user_id)
) WITH additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';


-- nosql.vn_provinces definition

CREATE TABLE nosql.vn_provinces (
    code text,
    name text,
    PRIMARY KEY (code)
) WITH additional_write_policy = '99p'
    AND bloom_filter_fp_chance = 0.01
    AND caching = {'keys':'ALL','rows_per_partition':'NONE'}
    AND comment = ''
    AND compaction = {'class':'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy','max_threshold':'32','min_threshold':'4'}
    AND compression = {'chunk_length_in_kb':'16','class':'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND default_time_to_live = 0
    AND extensions = {}
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair = 'BLOCKING'
    AND speculative_retry = '99p';