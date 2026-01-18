import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // ✅ dynamic from .env
  withCredentials: true, // if using Sanctum for auth
});

export default api;

export const login = async (email, password) => {
  const res = await fetch('https://student_portal.manadoindependent.sch.id/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error('Login gagal');
  }

  const data = await res.json();
  localStorage.setItem('token', data.token);
  return data;
};

export const getMe = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch('https://student_portal.manadoindependent.sch.id/api/me', {
    headers: {
      Authorization: Bearer ${token},
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user data');
  }

  return await res.json();
};

export const getRegistrationOptions = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch('https://student_portal.manadoindependent.sch.id/api/registration-option', {
    headers: {
      Authorization: Bearer ${token},
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch registration option');
  }

  return await res.json();
};

export const startRegistration = async (
  schoolYear,
  semester,
  registrationDate
) => {
  const token = localStorage.getItem('token');
  const res = await fetch('https://student_portal.manadoindependent.sch.id/api/registration/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: Bearer ${token},
    },
    body: JSON.stringify({
      school_year_id: schoolYear,
      semester_id: semester,
      registration_date: registrationDate,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to start registration');
  }

  return await res.json();
};

export const logout = async () => {
  const token = localStorage.getItem('token');
  await fetch('https://student_portal.manadoindependent.sch.id/api/logout', {
    method: 'POST',
    headers: {
      Authorization: Bearer ${token},
    },
  });
  localStorage.removeItem('token');
};

export const submitRegistrationForm = async (draftId, formData) => {
  const token = localStorage.getItem('token');
  const res = await fetch(
    https://student_portal.manadoindependent.sch.id/api/registration/store/${draftId},
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: Bearer ${token},
      },
      body: JSON.stringify(formData),
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    const error = new Error('Failed to submit registration form');
    error.response = {
      data: errorData,
      status: res.status,
    };
    throw error;
  }

  return await res.json();
};

export const searchStudent = async (searchTerm) => {
  const token = localStorage.getItem('token');
  const res = await fetch(
    `http://localhost:8000/api/students/search?search=${encodeURIComponent(
      searchTerm
    )}`,
    {
      headers: {
        Authorization: Bearer ${token},
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to search student');
  }

  return await res.json();
};

export const getStudentLatestApplication = async (studentId) => {
  const token = localStorage.getItem('token');
  const res = await fetch(
    https://student_portal.manadoindependent.sch.id/api/students/${studentId}/latest-application,
    {
      headers: {
        Authorization: Bearer ${token},
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to get latest application data');
  }

  return await res.json();
};

export const getRegistrationPreview = async (applicationId, version) => {
  const token = localStorage.getItem('token');
  const res = await fetch(
    https://student_portal.manadoindependent.sch.id/api/registration/preview/${applicationId}/version/${version},
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: Bearer ${token},
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch registration preview');
  }

  return await res.json();
};

// --- FUNGSI BARU UNTUK HALAMAN STUDENT LIST ---
export const getStudents = async ({
  search = '',
  school_year_id = null,
  semester_id = null,
  section_id = null,
} = {}) => {
  const token = localStorage.getItem('token');

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (school_year_id) params.append('school_year_id', school_year_id);
  if (semester_id) params.append('semester_id', semester_id);

  if (Array.isArray(section_id)) {
    section_id.forEach((id) => params.append('section_id[]', id));
  } else if (section_id) {
    params.append('section_id', section_id);
  }

  const res = await fetch(
    https://student_portal.manadoindependent.sch.id/api/students?${params.toString()},
    {
      headers: {
        Authorization: Bearer ${token},
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch student data');
  }

  return await res.json();
};

// --- FUNGSI BARU UNTUK UPDATE PROFIL MAHASISWA ---
export const updateStudent = async (studentId, studentData) => {
  const token = localStorage.getItem('token');
  const res = await fetch(
    https://student_portal.manadoindependent.sch.id/api/students/${studentId}/update,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: Bearer ${token},
      },
      body: JSON.stringify(studentData),
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    const error = new Error('Failed to update student data');
    error.response = {
      data: errorData,
      status: res.status,
    };
    throw error;
  }

  return await res.json();
};

// --- FUNGSI INI DIKEMBALIKAN UNTUK HALAMAN REGISTRATION ---
export const getRegistrations = async ({
  search = '',
  school_year_id = null,
  semester_id = null,
  section_id = null,
} = {}) => {
  const token = localStorage.getItem('token');

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (school_year_id) params.append('school_year_id', school_year_id);
  if (semester_id) params.append('semester_id', semester_id);

  if (Array.isArray(section_id)) {
    section_id.forEach((id) => params.append('section_id[]', id));
  } else if (section_id) {
    params.append('section_id', section_id);
  }

  const res = await fetch(
    https://student_portal.manadoindependent.sch.id/api/registration?${params.toString()},
    {
      headers: {
        Authorization: Bearer ${token},
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch registration data');
  }

  return await res.json();
};