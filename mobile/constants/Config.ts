import config from '../config/env';

export const Config = {
  apiUrl: config.apiUrl,
  appName: config.appName,
  secureStoreKeys: {
    userToken: 'ayur_user_token',
    userData: 'ayur_user_data',
  },
  roles: {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    THERAPIST: 'therapist',
    RECEPTIONIST: 'receptionist',
    PATIENT: 'patient',
  } as const,
};

export default Config;
