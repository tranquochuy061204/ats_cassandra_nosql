// Query constants
export const Q_CREATE_USER = `
  INSERT INTO users_by_id (
    user_id,
    address,
    created_at,
    full_name,
    gender,
    password_hash,
    role,
    user_email,
    province_code,
    district_code
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const Q_CREATE_USER_BY_EMAIL = `
  INSERT INTO users_by_email (user_email, user_id)
  VALUES (?, ?)
`;

// ✅ Thêm query mới
export const Q_CREATE_USER_BY_ROLE = `
  INSERT INTO users_by_role (role, user_id, full_name, email)
  VALUES (?, ?, ?, ?)
`;
