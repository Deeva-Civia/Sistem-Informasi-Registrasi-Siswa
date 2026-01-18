import React, { useState, useEffect, useCallback } from 'react';
import styles from './StudentInformationSection.module.css';
import Select from 'react-select';
import { getRegistrationOptions } from '../../../../../services/api';

const genderOptions = ['MALE', 'FEMALE'];
const citizenshipOptions = ['Indonesia', 'Non Indonesia'];
const religionOptions = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu',
  'Kristen Advent',
];

const StudentInformationSection = ({
  prefill,
  onDataChange,
  onValidationChange,
  errors,
  forceError,
}) => {
  const [academicStatusOptions, setAcademicStatusOptions] = useState([]);
  const [academicStatus, setAcademicStatus] = useState('');
  const [academicStatusOther, setAcademicStatusOther] = useState('');
  const [academicStatusError, setAcademicStatusError] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [firstNameError, setFirstNameError] = useState(false);
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState(false);
  const [nisn, setNisn] = useState('');
  const [nisnError, setNisnError] = useState(false);
  const [nik, setNik] = useState('');
  const [nikError, setNikError] = useState(false);
  const [kitas, setKitas] = useState('');
  const [kitasError, setKitasError] = useState(false);
  const [foreignCountry, setForeignCountry] = useState('');
  const [gender, setGender] = useState('');
  const [genderError, setGenderError] = useState(false);
  const [age, setAge] = useState('');
  const [rank, setRank] = useState('');
  const [rankError, setRankError] = useState(false);
  const [citizenship, setCitizenship] = useState('');
  const [citizenshipError, setCitizenshipError] = useState(false);
  const [religion, setReligion] = useState('');
  const [religionError, setReligionError] = useState(false);
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [placeOfBirthError, setPlaceOfBirthError] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfBirthError, setDateOfBirthError] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [previousSchool, setPreviousSchool] = useState('');
  const [previousSchoolError, setPreviousSchoolError] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(false);
  const [street, setStreet] = useState('');
  const [streetError, setStreetError] = useState(false);
  const [rt, setRt] = useState('0');
  const [rtError, setRtError] = useState(false);
  const [rw, setRw] = useState('0');
  const [rwError, setRwError] = useState(false);
  const [village, setVillage] = useState('');
  const [villageError, setVillageError] = useState(false);
  const [district, setDistrict] = useState('');
  const [districtError, setDistrictError] = useState(false);
  const [city, setCity] = useState('');
  const [cityError, setCityError] = useState(false);
  const [province, setProvince] = useState('');
  const [provinceError, setProvinceError] = useState(false);
  const [otherAddress, setOtherAddress] = useState('');
  const [otherAddressError, setOtherAddressError] = useState(false);

  const customSelectStyles = {
    control: (baseStyles) => ({
      ...baseStyles,
      border: 'none',
      boxShadow: 'none',
      backgroundColor: 'transparent',
    }),
    placeholder: (baseStyles) => ({
      ...baseStyles,
      fontFamily: 'Poppins, Arial, sans-serif',
      fontWeight: 400,
      color: 'rgba(128, 128, 128, 0.6)',
    }),
    singleValue: (baseStyles) => ({
      ...baseStyles,
      fontFamily: 'Poppins, Arial, sans-serif',
      fontWeight: 'bold',
      color: '#000',
    }),
  };

  useEffect(() => {
    getRegistrationOptions()
      .then((data) => {
        setAcademicStatusOptions(data.academic_status || []);
      })
      .catch((err) => {
        console.error('Failed to fetch academic status options:', err);
      });
  }, []);

  useEffect(() => {
    if (prefill && Object.keys(prefill).length > 0) {
      // ... logic prefill
    } else if (Object.keys(prefill).length === 0) {
      // ... logic reset (yang memicu loop)
    }
  }, [prefill]);

  useEffect(() => {
    // Hanya lakukan aksi jika prefill berubah
    if (prefill && Object.keys(prefill).length > 0) {
      // Jika ada data prefill, isi state lokal
      setFirstName(prefill.first_name || '');
      setMiddleName(prefill.middle_name || '');
      setLastName(prefill.last_name || '');
      setNickname(prefill.nickname || '');
      setNisn(prefill.nisn || '');
      setNik(prefill.nik || '');
      setKitas(prefill.kitas || '');
      setForeignCountry(prefill.country || '');
      setGender(prefill.gender || '');
      setRank(prefill.family_rank || '');
      setCitizenship(prefill.citizenship || '');
      setReligion(prefill.religion || '');
      setPlaceOfBirth(prefill.place_of_birth || '');
      setDateOfBirth(prefill.date_of_birth || '');
      setEmail(prefill.email || '');
      setPreviousSchool(prefill.previous_school || '');
      setPhone(prefill.phone_number || '');
      setAcademicStatus(prefill.academic_status || '');
      setAcademicStatusOther(prefill.academic_status_other || '');
      setStreet(prefill.street || '');
      setRt(prefill.rt || '0'); // Default ke "0"
      setRw(prefill.rw || '0'); // Default ke "0"
      setVillage(prefill.village || '');
      setDistrict(prefill.district || '');
      setCity(prefill.city_regency || '');
      setProvince(prefill.province || '');
      setOtherAddress(prefill.other || '');
    }
  }, [prefill]);

  useEffect(() => {
    if (errors) {
      setFirstNameError(!!errors.first_name);
      setNicknameError(!!errors.nickname);
      setNisnError(!!errors.nisn);
      setNikError(!!errors.nik);
      setKitasError(!!errors.kitas);
      setGenderError(!!errors.gender);
      setRankError(!!errors.family_rank);
      setCitizenshipError(!!errors.citizenship);
      setReligionError(!!errors.religion);
      setPlaceOfBirthError(!!errors.place_of_birth);
      setDateOfBirthError(!!errors.date_of_birth);
      setEmailError(!!errors.email);
      setPreviousSchoolError(!!errors.previous_school);
      setPhoneError(!!errors.phone_number);
      setStreetError(!!errors.street);
      setRtError(!!errors.rt);
      setRwError(!!errors.rw);
      setVillageError(!!errors.village);
      setDistrictError(!!errors.district);
      setCityError(!!errors.city_regency);
      setProvinceError(!!errors.province);
      setOtherAddressError(!!errors.other);
      setAcademicStatusError(!!errors.academic_status);
    }
  }, [errors]);

  useEffect(() => {
    if (forceError) {
      if (forceError.first_name) setFirstNameError(true);
      if (forceError.nickname) setNicknameError(true);
      if (forceError.nisn) setNisnError(true);
      if (forceError.nik) setNikError(true);
      if (forceError.kitas) setKitasError(true);
      if (forceError.gender) setGenderError(true);
      if (forceError.family_rank) setRankError(true);
      if (forceError.citizenship) setCitizenshipError(true);
      if (forceError.religion) setReligionError(true);
      if (forceError.place_of_birth) setPlaceOfBirthError(true);
      if (forceError.date_of_birth) setDateOfBirthError(true);
      if (forceError.email) setEmailError(true);
      if (forceError.previous_school) setPreviousSchoolError(true);
      if (forceError.phone_number) setPhoneError(true);
      if (forceError.street) setStreetError(true);
      if (forceError.rt) setRtError(true);
      if (forceError.rw) setRwError(true);
      if (forceError.village) setVillageError(true);
      if (forceError.district) setDistrictError(true);
      if (forceError.city_regency) setCityError(true);
      if (forceError.province) setProvinceError(true);
      if (forceError.other) setOtherAddressError(true);
      if (forceError.academic_status) setAcademicStatusError(true);
    }
  }, [forceError]);

  const handleAcademicStatusChange = (opt) => {
    const selectedValue = opt ? opt.value : '';
    setAcademicStatus(selectedValue);
    if (academicStatusError) {
      setAcademicStatusError(false);
    }

    let dataToUpdate = { academic_status: selectedValue };

    if (selectedValue !== 'OTHER') {
      setAcademicStatusOther('');
      dataToUpdate.academic_status_other = '';
    } else {
      dataToUpdate.academic_status_other = academicStatusOther;
    }
    onDataChange(dataToUpdate);
  };

  const handleAcademicStatusOtherChange = (e) => {
    const value = e.target.value;
    setAcademicStatusOther(value);
    onDataChange({
      academic_status: 'OTHER',
      academic_status_other: value,
    });
  };

  const validateNIK = (value) => {
    const nikRegex = /^[1-9][0-9]{15}$/;
    if (value && !nikRegex.test(value)) {
      setNikError(true);
      return false;
    }
    setNikError(false);
    return true;
  };

  const validateKITAS = (value) => {
    if (value && (value.length < 11 || value.length > 16)) {
      setKitasError(true);
      return false;
    }
    setKitasError(false);
    return true;
  };

  const validateNISN = (value) => {
    const nisnRegex = /^\d{10}$/;
    if (value && !nisnRegex.test(value)) {
      setNisnError(true);
      return false;
    }
    setNisnError(false);
    return true;
  };

  const handleFirstName = (value) => {
    setFirstName(value);
    if (firstNameError && value.trim()) setFirstNameError(false);
    onDataChange({ first_name: value });
  };

  const handleMiddleName = (value) => {
    setMiddleName(value);
    onDataChange({ middle_name: value });
  };

  const handleLastName = (value) => {
    setLastName(value);
    onDataChange({ last_name: value });
  };

  const handleNickname = (value) => {
    setNickname(value);
    if (nicknameError && value.trim()) setNicknameError(false);
    onDataChange({ nickname: value });
  };

  const handleNisn = (value) => {
    setNisn(value);
    validateNISN(value);
    onDataChange({ nisn: value });
  };

  const handleNik = (value) => {
    setNik(value);
    validateNIK(value);
    onDataChange({ nik: value });
  };

  const handleKitas = (value) => {
    setKitas(value);
    validateKITAS(value);
    onDataChange({ kitas: value });
  };

  const handleForeignCountry = (value) => {
    setForeignCountry(value);
    onDataChange({ country: value });
  };

  const handleGender = (value) => {
    setGender(value);
    if (genderError && value) setGenderError(false);
    onDataChange({ gender: value });
  };

  const handleFamilyRank = (value) => {
    setRank(value);
    if (rankError && value.trim()) setRankError(false);
    onDataChange({ family_rank: value });
  };

  const handleCitizenship = (opt) => {
    const value = opt ? opt.value : '';
    setCitizenship(value);
    if (citizenshipError && value) setCitizenshipError(false);
    let updatedData = { citizenship: value };
    if (value === 'Indonesia') {
      setKitas('');
      setForeignCountry('');
      setKitasError(false);
      updatedData = { ...updatedData, kitas: '', country: '' };
    } else if (value === 'Non Indonesia') {
      setNik('');
      setNikError(false);
      updatedData = { ...updatedData, nik: '' };
    }
    onDataChange(updatedData);
  };

  const handleReligion = (opt) => {
    const value = opt ? opt.value : '';
    setReligion(value);
    if (religionError && value.trim()) setReligionError(false);
    onDataChange({ religion: value });
  };

  const handlePlaceOfBirth = (value) => {
    setPlaceOfBirth(value);
    if (placeOfBirthError && value.trim()) setPlaceOfBirthError(false);
    onDataChange({ place_of_birth: value });
  };

  const handleDateOfBirth = (value) => {
    setDateOfBirth(value);
    if (dateOfBirthError && value) setDateOfBirthError(false);
    onDataChange({ date_of_birth: value });
  };

  const handleEmail = (value) => {
    setEmail(value);
    if (emailError && value.trim()) setEmailError(false);
    onDataChange({ email: value });
  };

  const handlePreviousSchool = (value) => {
    setPreviousSchool(value);
    if (previousSchoolError && value.trim()) setPreviousSchoolError(false);
    onDataChange({ previous_school: value });
  };

  const handlePhone = (value) => {
    setPhone(value);
    if (phoneError && value.trim()) setPhoneError(false);
    onDataChange({ phone_number: value });
  };

  const handleStreet = (value) => {
    setStreet(value);
    if (streetError && value.trim()) setStreetError(false);
    onDataChange({ street: value });
  };

  const handleRt = (value) => {
    setRt(value);
    if (rtError && value.trim()) setRtError(false);
    onDataChange({ rt: value.trim() === '' ? '0' : value });
  };

  const handleRw = (value) => {
    setRw(value);
    if (rwError && value.trim()) setRwError(false);
    onDataChange({ rw: value.trim() === '' ? '0' : value });
  };

  const handleVillage = (value) => {
    setVillage(value);
    if (villageError && value.trim()) setVillageError(false);
    onDataChange({ village: value });
  };

  const handleDistrict = (value) => {
    setDistrict(value);
    if (districtError && value.trim()) setDistrictError(false);
    onDataChange({ district: value });
  };

  const handleCity = (value) => {
    setCity(value);
    if (cityError && value.trim()) setCityError(false);
    onDataChange({ city_regency: value });
  };

  const handleProvince = (value) => {
    setProvince(value);
    if (provinceError && value.trim()) setProvinceError(false);
    onDataChange({ province: value });
  };

  const handleOtherAddress = (value) => {
    setOtherAddress(value);
    if (otherAddressError && value.trim()) setOtherAddressError(false);
    onDataChange({ other: value });
  };

  const updateAge = useCallback(
    (newAge) => {
      setAge(newAge);
      onDataChange({ age: newAge });
    },
    [onDataChange]
  );

  useEffect(() => {
    if (dateOfBirth) {
      try {
        const dob = new Date(dateOfBirth);
        const now = new Date();
        if (isNaN(dob.getTime()) || dob > now) {
          updateAge('');
          return;
        }
        let years = now.getFullYear() - dob.getFullYear();
        let months = now.getMonth() - dob.getMonth();
        if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
          years--;
          months += 12;
        }
        const calculatedAge = `${years} years, ${months} months`;
        updateAge(calculatedAge);
      } catch (error) {
        console.error('Error calculating age:', error);
        updateAge('');
      }
    } else {
      updateAge('');
    }
  }, [dateOfBirth, updateAge]);

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.headerTitle}>STUDENT'S INFORMATION</span>
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.infoSection}>
          <div className={styles.row}>
            <div
              className={`${styles.nameField} ${
                firstNameError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  firstNameError ? styles.errorLabel : ''
                }`}
                htmlFor='firstName'
              >
                First name
              </label>
              <input
                id='firstName'
                className={`${styles.label} ${firstName ? 'hasValue' : ''} ${
                  firstNameError ? styles.errorInput : ''
                }`}
                type='text'
                value={firstName}
                onChange={(e) => {
                  handleFirstName(e.target.value);
                  if (firstNameError && e.target.value.trim()) {
                    setFirstNameError(false);
                  }
                }}
                onFocus={() => {
                  if (firstNameError) {
                    setFirstNameError(false);
                  }
                }}
                placeholder='First name'
              />
            </div>
            <div className={styles.nameField}>
              <label className={styles.label} htmlFor='middleName'>
                Middle name
              </label>
              <input
                id='middleName'
                className={`${styles.label} ${middleName ? 'hasValue' : ''}`}
                type='text'
                value={middleName}
                onChange={(e) => handleMiddleName(e.target.value)}
                placeholder='Middle name'
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.nicknameField}>
              <label className={styles.label} htmlFor='lastName'>
                Last name
              </label>
              <input
                id='lastName'
                className={`${styles.label} ${lastName ? 'hasValue' : ''}`}
                type='text'
                value={lastName}
                onChange={(e) => handleLastName(e.target.value)}
                placeholder='Last name'
              />
            </div>
            <div
              className={`${styles.nicknameField} ${
                nicknameError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  nicknameError ? styles.errorLabel : ''
                }`}
                htmlFor='nickname'
              >
                Nickname
              </label>
              <input
                id='nickname'
                className={`${styles.valueHighlight} ${
                  nickname ? 'hasValue' : ''
                } ${nicknameError ? styles.errorInput : ''}`}
                type='text'
                value={nickname}
                onChange={(e) => {
                  handleNickname(e.target.value);
                  if (nicknameError && e.target.value.trim()) {
                    setNicknameError(false);
                  }
                }}
                onFocus={() => {
                  if (nicknameError) {
                    setNicknameError(false);
                  }
                }}
                placeholder='Nickname'
              />
            </div>
          </div>
          <div className={styles.row}>
            <div
              className={`${styles.citizenshipField} ${
                citizenshipError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  citizenshipError ? styles.errorLabel : ''
                }`}
                htmlFor='citizenship'
              >
                Citizenship
              </label>
              <Select
                id='citizenship'
                value={
                  citizenship
                    ? { value: citizenship, label: citizenship }
                    : null
                }
                onChange={handleCitizenship}
                options={citizenshipOptions.map((opt) => ({
                  value: opt,
                  label: opt,
                }))}
                styles={customSelectStyles}
                placeholder='Select citizenship'
                isClearable
                className={citizenshipError ? styles.errorInput : ''}
              />
            </div>
            <div
              className={`${styles.citizenshipField} ${
                religionError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  religionError ? styles.errorLabel : ''
                }`}
                htmlFor='religion'
              >
                Religion
              </label>
              <Select
                id='religion'
                value={religion ? { value: religion, label: religion } : null}
                onChange={handleReligion}
                options={religionOptions.map((opt) => ({
                  value: opt,
                  label: opt,
                }))}
                styles={customSelectStyles}
                placeholder='Select religion'
                isClearable
                onFocus={() => {
                  if (religionError) {
                    setReligionError(false);
                  }
                }}
              />
            </div>
            <div
              className={`${styles.citizenshipField} ${
                placeOfBirthError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  placeOfBirthError ? styles.errorLabel : ''
                }`}
                htmlFor='placeOfBirth'
              >
                Place of birth
              </label>
              <input
                id='placeOfBirth'
                className={`${styles.valueHighlight} ${
                  placeOfBirth ? 'hasValue' : ''
                } ${placeOfBirthError ? styles.errorInput : ''}`}
                type='text'
                value={placeOfBirth}
                onChange={(e) => {
                  handlePlaceOfBirth(e.target.value);
                  if (placeOfBirthError && e.target.value.trim()) {
                    setPlaceOfBirthError(false);
                  }
                }}
                onFocus={() => {
                  if (placeOfBirthError) {
                    setPlaceOfBirthError(false);
                  }
                }}
                placeholder='Place of birth'
              />
            </div>
            <div
              className={`${styles.nicknameField} ${
                dateOfBirthError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  dateOfBirthError ? styles.errorLabel : ''
                }`}
                htmlFor='dateOfBirth'
              >
                Date of birth
              </label>
              <div className={styles.dateInputWrapper}>
                <input
                  id='dateOfBirth'
                  type='date'
                  value={dateOfBirth}
                  onChange={(e) => {
                    handleDateOfBirth(e.target.value);
                    if (dateOfBirthError && e.target.value) {
                      setDateOfBirthError(false);
                    }
                  }}
                  onFocus={() => {
                    if (dateOfBirthError) {
                      setDateOfBirthError(false);
                    }
                  }}
                  className={`${styles.dateInput} ${
                    dateOfBirth ? 'hasValue' : ''
                  } ${dateOfBirthError ? styles.errorInput : ''}`}
                  max={new Date().toISOString().split('T')[0]}
                />
                <div className={styles.calendarIcon}>
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z'
                      stroke='currentColor'
                      strokeWidth='1.5'
                      strokeMiterlimit='10'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {citizenship === 'Non Indonesia' && (
            <div className={styles.nicknameField}>
              <label
                className={`${styles.label} ${
                  errors.country ? styles.errorLabel : ''
                }`}
                htmlFor='foreignCountry'
              >
                Country of origin
              </label>
              <div className={styles.inputWithError}>
                <input
                  id='foreignCountry'
                  className={`${styles.valueHighlight} ${
                    foreignCountry ? 'hasValue' : ''
                  } ${errors.country ? styles.errorInput : ''}`}
                  type='text'
                  value={foreignCountry}
                  onChange={(e) => handleForeignCountry(e.target.value)}
                  placeholder='Country of Origin'
                />
                {errors.country && (
                  <div className={styles.inlineErrorMessage}>
                    Country of Origin is required
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.row}>
            {citizenship === 'Non Indonesia' && (
              <div className={styles.nicknameField}>
                <label
                  className={`${styles.label} ${
                    kitasError ? styles.errorLabel : ''
                  }`}
                  htmlFor='kitas'
                >
                  KITAS
                </label>
                <div className={styles.inputWithError}>
                  <input
                    id='kitas'
                    className={`${styles.valueHighlight} ${
                      kitas ? 'hasValue' : ''
                    } ${kitasError ? styles.errorInput : ''}`}
                    type='text'
                    value={kitas}
                    onChange={(e) => handleKitas(e.target.value)}
                    placeholder='KITAS is required'
                    maxLength={50}
                  />
                  {kitasError && (
                    <div className={styles.inlineErrorMessage}>
                      KITAS must be more than 11 characters
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className={styles.nicknameField}>
              <label
                className={`${styles.label} ${
                  nisnError ? styles.errorLabel : ''
                }`}
                htmlFor='nisn'
              >
                Nomor Induk Siswa Nasional (NISN)
              </label>
              <div className={styles.inputWithError}>
                <input
                  id='nisn'
                  className={`${styles.label} ${nisn ? 'hasValue' : ''} ${
                    nisnError ? styles.errorInput : ''
                  }`}
                  type='text'
                  value={nisn}
                  onChange={(e) => handleNisn(e.target.value)}
                  placeholder='NISN (10 digits)'
                  maxLength={10}
                />
                {nisnError && (
                  <div className={styles.inlineErrorMessage}>
                    NISN must be exactly 10 digits
                  </div>
                )}
              </div>
            </div>
            {citizenship === 'Indonesia' && (
              <div className={styles.nicknameField}>
                <label
                  className={`${styles.label} ${
                    nikError ? styles.errorLabel : ''
                  }`}
                  htmlFor='nik'
                >
                  Nomor Induk Kependudukan (NIK)
                </label>
                <div className={styles.inputWithError}>
                  <input
                    id='nik'
                    className={`${styles.label} ${nik ? 'hasValue' : ''} ${
                      nikError ? styles.errorInput : ''
                    }`}
                    type='text'
                    value={nik}
                    onChange={(e) => handleNik(e.target.value)}
                    placeholder='NIK (16 digits)'
                    maxLength={16}
                  />
                  {nikError && (
                    <div className={styles.inlineErrorMessage}>
                      NIK must be exactly 16 digits
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className={`${styles.row} ${styles.genderRow}`}>
            <div
              className={`${styles.genderField} ${
                genderError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  genderError ? styles.errorLabel : ''
                }`}
                htmlFor='gender'
              >
                Gender
              </label>
              <Select
                id='gender'
                options={genderOptions.map((opt) => ({
                  value: opt,
                  label: opt,
                }))}
                placeholder='Select gender'
                value={gender ? { value: gender, label: gender } : null}
                onChange={(opt) => {
                  handleGender(opt ? opt.value : '');
                  if (genderError && opt?.value) {
                    setGenderError(false);
                  }
                }}
                onFocus={() => {
                  if (genderError) {
                    setGenderError(false);
                  }
                }}
                isClearable
                styles={customSelectStyles}
              />
            </div>
            <div
              className={`${styles.genderField} ${styles.rankField} ${
                rankError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  rankError ? styles.errorLabel : ''
                }`}
                htmlFor='rank'
              >
                Rank in the family
              </label>
              <input
                id='rank'
                className={`${styles.valueSmall} ${rank ? 'hasValue' : ''} ${
                  rankError ? styles.errorInput : ''
                }`}
                type='number'
                value={rank}
                onChange={(e) => {
                  handleFamilyRank(e.target.value);
                  if (rankError && e.target.value.trim()) {
                    setRankError(false);
                  }
                }}
                onFocus={() => {
                  if (rankError) {
                    setRankError(false);
                  }
                }}
                placeholder='1'
                min='1'
                max='99'
              />
            </div>
            <div className={`${styles.genderField} ${styles.ageField}`}>
              <label className={styles.label} htmlFor='age'>
                Age
              </label>
              <div
                className={`${styles.valueSmall} ${age ? 'hasValue' : ''}`}
                id='age'
              >
                {age || <>&nbsp;</>}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.infoSection}>
          <div className={styles.topRow}>
            <div
              className={`${styles.emailField} ${
                emailError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  emailError ? styles.errorLabel : ''
                }`}
                htmlFor='email'
              >
                Email address
              </label>
              <div className={styles.inputWithError}>
                <input
                  id='email'
                  className={`${styles.valueHighlight} ${
                    email ? 'hasValue' : ''
                  } ${emailError ? styles.errorInput : ''}`}
                  type='email'
                  value={email}
                  onChange={(e) => {
                    handleEmail(e.target.value);
                    if (emailError && e.target.value.trim()) {
                      setEmailError(false);
                    }
                  }}
                  onFocus={() => {
                    if (emailError) {
                      setEmailError(false);
                    }
                  }}
                  placeholder='Johndoe@gmail.com'
                />
                {emailError && (
                  <div className={styles.inlineErrorMessage}>
                    Please enter a valid email address
                  </div>
                )}
              </div>
            </div>
            <div
              className={`${styles.previousSchoolField} ${
                previousSchoolError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  previousSchoolError ? styles.errorLabel : ''
                }`}
                htmlFor='previousSchool'
              >
                Previous school
              </label>
              <input
                id='previousSchool'
                className={`${styles.valueHighlight} ${
                  previousSchool ? 'hasValue' : ''
                } ${previousSchoolError ? styles.errorInput : ''}`}
                type='text'
                value={previousSchool}
                onChange={(e) => {
                  handlePreviousSchool(e.target.value);
                  if (previousSchoolError && e.target.value.trim()) {
                    setPreviousSchoolError(false);
                  }
                }}
                onFocus={() => {
                  if (previousSchoolError) {
                    setPreviousSchoolError(false);
                  }
                }}
                placeholder='Previous School'
              />
            </div>
          </div>
          <div className={styles.topRow}>
            <div
              className={`${styles.phoneField} ${
                phoneError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  phoneError ? styles.errorLabel : ''
                }`}
                htmlFor='phone'
              >
                Phone number
              </label>
              <div className={styles.inputWithError}>
                <input
                  id='phone'
                  className={`${styles.valueHighlight} ${
                    phone ? 'hasValue' : ''
                  } ${phoneError ? styles.errorInput : ''}`}
                  type='text'
                  value={phone}
                  maxLength='20'
                  onChange={(e) => {
                    handlePhone(e.target.value);
                    if (phoneError && e.target.value.trim()) {
                      setPhoneError(false);
                    }
                  }}
                  onFocus={() => {
                    if (phoneError) {
                      setPhoneError(false);
                    }
                  }}
                  placeholder='Phone number'
                />
                {phoneError && (
                  <div className={styles.inlineErrorMessage}>
                    Phone number must be at most 20 characters
                  </div>
                )}
              </div>
            </div>
            <div
              className={`${styles.academicStatusField} ${
                academicStatusError ? styles.errorFieldWrapper : ''
              }`}
            >
              <label
                className={`${styles.label} ${
                  academicStatusError ? styles.errorLabel : ''
                }`}
                htmlFor='academicStatus'
              >
                Academic status
              </label>

              <div className={styles.academicStatusWrapper}>
                <Select
                  id='academicStatus'
                  options={academicStatusOptions.map((opt) => ({
                    value: opt,
                    label: opt,
                  }))}
                  styles={customSelectStyles}
                  placeholder='Select status'
                  value={
                    academicStatus
                      ? { value: academicStatus, label: academicStatus }
                      : null
                  }
                  onChange={handleAcademicStatusChange}
                  isClearable
                  classNamePrefix={
                    academicStatusError ? 'react-select-error' : 'react-select'
                  }
                />

                {/* Input 'Other' akan muncul di sebelah kanan jika kondisi terpenuhi */}
                {academicStatus === 'OTHER' && (
                  <input
                    className={styles.otherInput}
                    type='text'
                    value={academicStatusOther}
                    onChange={handleAcademicStatusOtherChange}
                    placeholder='Please specify'
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.infoSection}>
          <div className={styles.addressSection}>
            <div className={styles.addressRow}>
              <div
                className={`${styles.genderField} ${
                  streetError ? styles.errorFieldWrapper : ''
                }`}
              >
                <label
                  className={`${styles.label} ${
                    streetError ? styles.errorLabel : ''
                  }`}
                  htmlFor='street'
                >
                  Street
                </label>
                <input
                  id='street'
                  className={`${styles.valueHighlight} ${
                    street ? 'hasValue' : ''
                  } ${streetError ? styles.errorInput : ''}`}
                  type='text'
                  value={street}
                  onChange={(e) => {
                    handleStreet(e.target.value);
                    if (streetError && e.target.value.trim()) {
                      setStreetError(false);
                    }
                  }}
                  onFocus={() => {
                    if (streetError) {
                      setStreetError(false);
                    }
                  }}
                  placeholder='Street'
                />
              </div>
              <div className={styles.rtrwGroup}>
                <div className={styles.rtField}>
                  <label
                    className={`${styles.label} ${
                      rtError ? styles.errorLabel : ''
                    }`}
                    htmlFor='rt'
                  >
                    RT
                  </label>
                  <input
                    id='rt'
                    className={`${styles.label} ${rt ? 'hasValue' : ''} ${
                      rtError ? styles.errorInput : ''
                    }`}
                    type='text'
                    value={rt}
                    onChange={(e) => handleRt(e.target.value)}
                    placeholder='001'
                  />
                </div>
                <div className={styles.rtField}>
                  <label
                    className={`${styles.label} ${
                      rwError ? styles.errorLabel : ''
                    }`}
                    htmlFor='rw'
                  >
                    RW
                  </label>
                  <input
                    id='rw'
                    className={`${styles.label} ${rw ? 'hasValue' : ''} ${
                      rwError ? styles.errorInput : ''
                    }`}
                    type='text'
                    value={rw}
                    onChange={(e) => handleRw(e.target.value)}
                    placeholder='002'
                  />
                </div>
              </div>
            </div>
            <div className={styles.addressRow}>
              <div
                className={`${styles.genderField} ${
                  villageError ? styles.errorFieldWrapper : ''
                }`}
              >
                <label
                  className={`${styles.label} ${
                    villageError ? styles.errorLabel : ''
                  }`}
                  htmlFor='village'
                >
                  Village
                </label>
                <input
                  id='village'
                  className={`${styles.valueHighlight} ${
                    village ? 'hasValue' : ''
                  } ${villageError ? styles.errorInput : ''}`}
                  type='text'
                  value={village}
                  onChange={(e) => {
                    handleVillage(e.target.value);
                    if (villageError && e.target.value.trim()) {
                      setVillageError(false);
                    }
                  }}
                  onFocus={() => {
                    if (villageError) {
                      setVillageError(false);
                    }
                  }}
                  placeholder='Village'
                />
              </div>
              <div
                className={`${styles.districtField} ${
                  districtError ? styles.errorFieldWrapper : ''
                }`}
              >
                <label
                  className={`${styles.label} ${
                    districtError ? styles.errorLabel : ''
                  }`}
                  htmlFor='district'
                >
                  District
                </label>
                <input
                  id='district'
                  className={`${styles.valueHighlight} ${
                    district ? 'hasValue' : ''
                  } ${districtError ? styles.errorInput : ''}`}
                  type='text'
                  value={district}
                  onChange={(e) => {
                    handleDistrict(e.target.value);
                    if (districtError && e.target.value.trim()) {
                      setDistrictError(false);
                    }
                  }}
                  onFocus={() => {
                    if (districtError) {
                      setDistrictError(false);
                    }
                  }}
                  placeholder='District'
                />
              </div>
            </div>
            <div className={styles.addressRow}>
              <div
                className={`${styles.genderField} ${
                  cityError ? styles.errorFieldWrapper : ''
                }`}
              >
                <label
                  className={`${styles.label} ${
                    cityError ? styles.errorLabel : ''
                  }`}
                  htmlFor='city'
                >
                  City/Regency
                </label>
                <input
                  id='city'
                  className={`${styles.valueHighlight} ${
                    city ? 'hasValue' : ''
                  } ${cityError ? styles.errorInput : ''}`}
                  type='text'
                  value={city}
                  onChange={(e) => {
                    handleCity(e.target.value);
                    if (cityError && e.target.value.trim()) {
                      setCityError(false);
                    }
                  }}
                  onFocus={() => {
                    if (cityError) {
                      setCityError(false);
                    }
                  }}
                  placeholder='City/Regency'
                />
              </div>
              <div
                className={`${styles.genderField} ${
                  provinceError ? styles.errorFieldWrapper : ''
                }`}
              >
                <label
                  className={`${styles.label} ${
                    provinceError ? styles.errorLabel : ''
                  }`}
                  htmlFor='province'
                >
                  Province
                </label>
                <input
                  id='province'
                  className={`${styles.valueHighlight} ${
                    province ? 'hasValue' : ''
                  } ${provinceError ? styles.errorInput : ''}`}
                  type='text'
                  value={province}
                  onChange={(e) => {
                    handleProvince(e.target.value);
                    if (provinceError && e.target.value.trim()) {
                      setProvinceError(false);
                    }
                  }}
                  onFocus={() => {
                    if (provinceError) {
                      setProvinceError(false);
                    }
                  }}
                  placeholder='Province'
                />
              </div>
            </div>
            <div className={styles.otherAddressWrapper}>
              <div className={styles.otherField}>
                <div className={styles.label}>Other</div>
                <div className={styles.otherAddressParent}>
                  <span className={styles.bracket}>(</span>
                  <input
                    id='otherAddress'
                    className={`${styles.otherAddressInput} ${
                      otherAddress ? 'hasValue' : ''
                    } ${otherAddressError ? styles.errorInput : ''}`}
                    type='text'
                    value={otherAddress}
                    onChange={(e) => handleOtherAddress(e.target.value)}
                  />
                  <span className={styles.bracket}>)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentInformationSection;
