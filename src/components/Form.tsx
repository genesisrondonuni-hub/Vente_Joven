import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  ShieldAlert, 
  Target, 
  Send, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle 
} from 'lucide-react';
import styles from './Form.module.css';

interface FormData {
  nombres: string;
  cedula: string;
  fechaNacimiento: string;
  telefono: string;
  redesSociales: string;
  parroquia: string;
  sector: string;
  inscritoRE: string;
  centroVotacion: string;
  red600k: string;
  areasTrabajo: string[];
  compromisoDecalogo: string;
}

const initialFormData: FormData = {
  nombres: '',
  cedula: '',
  fechaNacimiento: '',
  telefono: '',
  redesSociales: '',
  parroquia: '',
  sector: '',
  inscritoRE: '',
  centroVotacion: '',
  red600k: '',
  areasTrabajo: [],
  compromisoDecalogo: ''
};

export default function Form() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Obtener URL de las variables de entorno
  const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  const isConfigured = !!GOOGLE_SCRIPT_URL;

  // Rango de fechas de nacimiento permitidas (15 a 30 años)
  const today = new Date();
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = formatDateString(new Date(today.getFullYear() - 30, today.getMonth(), today.getDate()));
  const maxDate = formatDateString(new Date(today.getFullYear() - 15, today.getMonth(), today.getDate()));

  // Calcular edad del usuario
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return 0;
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(formData.fechaNacimiento);

  // Validadores y formateadores de campos
  const validateCedula = (cedula: string) => {
    const rawDigits = cedula.replace(/[^0-9]/g, '');
    return rawDigits.length >= 6 && rawDigits.length <= 9;
  };

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      setFormData(prev => ({ ...prev, cedula: '' }));
      return;
    }
    
    let letter = 'V';
    let digits = '';
    const cleanRaw = rawValue.replace(/\s+/g, '');
    const firstChar = cleanRaw.charAt(0).toUpperCase();

    if (firstChar === 'E' || firstChar === 'V') {
      letter = firstChar;
      digits = cleanRaw.slice(1).replace(/\D/g, '');
    } else {
      digits = cleanRaw.replace(/\D/g, '');
    }
    
    const truncatedDigits = digits.slice(0, 9);
    let formattedDigits = '';
    if (truncatedDigits.length > 0) {
      formattedDigits = truncatedDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    setFormData(prev => ({ ...prev, cedula: `${letter}-${formattedDigits}` }));
  };

  const validatePhone = (phone: string) => {
    const raw = phone.replace(/-/g, '');
    if (raw.length !== 11) return false;
    const validPrefixes = ['0414', '0424', '0412', '0416', '0426'];
    const prefix = raw.slice(0, 4);
    return validPrefixes.includes(prefix);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '');
    const truncatedDigits = digits.slice(0, 11);
    
    let formatted = '';
    if (truncatedDigits.length <= 4) {
      formatted = truncatedDigits;
    } else {
      formatted = `${truncatedDigits.slice(0, 4)}-${truncatedDigits.slice(4)}`;
    }
    
    setFormData(prev => ({ ...prev, telefono: formatted }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      if (checked) {
        return { ...prev, areasTrabajo: [...prev.areasTrabajo, value] };
      } else {
        return { ...prev, areasTrabajo: prev.areasTrabajo.filter(item => item !== value) };
      }
    });
  };

  // Validación por pasos
  const isStep1Valid = () => {
    const { nombres, cedula, fechaNacimiento, telefono } = formData;
    return (
      nombres.trim().length > 2 &&
      validateCedula(cedula) &&
      fechaNacimiento !== '' &&
      age >= 15 && age <= 30 &&
      validatePhone(telefono)
    );
  };

  const isStep2Valid = () => {
    const { parroquia, sector } = formData;
    return parroquia !== '' && sector.trim().length > 2;
  };

  const isStep3Valid = () => {
    const { inscritoRE, centroVotacion, red600k } = formData;
    if (inscritoRE === '') return false;
    if (inscritoRE === 'Sí' && centroVotacion.trim().length < 4) return false;
    return red600k !== '';
  };

  const isStep4Valid = () => {
    const { compromisoDecalogo } = formData;
    return compromisoDecalogo === 'Sí, asumo el compromiso.' && privacyAccepted;
  };

  const nextStep = () => {
    if (currentStep === 1 && isStep1Valid()) setCurrentStep(2);
    else if (currentStep === 2 && isStep2Valid()) setCurrentStep(3);
    else if (currentStep === 3 && isStep3Valid()) setCurrentStep(4);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Valid() || !isStep2Valid() || !isStep3Valid() || !isStep4Valid()) return;
    if (!isConfigured) {
      setSubmissionError('No se puede enviar el formulario porque el servidor de destino no está configurado.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        let errorMessage = `Error en el servidor (código: ${response.status}).`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          // Ignorar error de parsing
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.result === 'success') {
        setIsSubmitted(true);
      } else {
        throw new Error(result.error || 'Ocurrió un error en el procesamiento de los datos.');
      }
    } catch (error) {
      console.error('Error al enviar los datos:', error);
      setSubmissionError(
        error instanceof Error 
          ? error.message 
          : 'Error de conexión. Verifica tu internet e inténtalo de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setSubmissionError(null);
    setFormData(initialFormData);
    setPrivacyAccepted(false);
    setCurrentStep(1);
  };

  if (isSubmitted) {
    return (
      <div className={styles.successMessage}>
        <CheckCircle size={72} color="var(--success-color)" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
        <h2>Registro Completado con Éxito</h2>
        <p>Tu información ha sido almacenada de forma segura en la base de datos de la Coordinación Juvenil.</p>
        <p className={styles.successTextBold}>
          Si seleccionaste disponibilidad para Estructura Electoral o Red 600K, nuestro equipo te contactará directamente vía WhatsApp/Telegram en un lapso no mayor a 48 horas.
        </p>
        <button className={styles.submitButton} onClick={resetForm} style={{ marginTop: '2rem' }}>
          Registrar a otro ciudadano
        </button>
      </div>
    );
  }

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      
      {/* Alerta de Configuración */}
      {!isConfigured && (
        <div className={styles.configWarning}>
          <h3><AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Advertencia de Configuración</h3>
          <p>
            La variable de entorno <strong>VITE_GOOGLE_SCRIPT_URL</strong> no está definida. 
            El envío del formulario está deshabilitado en este momento. Por favor configure el archivo <code>.env</code>.
          </p>
        </div>
      )}

      {/* Stepper Wizard Progress Bar */}
      <div className={styles.stepperContainer}>
        <div className={styles.stepInfo}>
          <span className={styles.stepTitle}>
            {currentStep === 1 && 'Datos Personales'}
            {currentStep === 2 && 'Ubicación Territorial'}
            {currentStep === 3 && 'Inteligencia Electoral'}
            {currentStep === 4 && 'Habilidades y Compromiso'}
          </span>
          <span className={styles.stepNumber}>Paso {currentStep} de 4</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(currentStep / 4) * 100}%` }} />
        </div>
      </div>

      {/* PASO 1: DATOS PERSONALES */}
      {currentStep === 1 && (
        <div className={styles.formStep}>
          <h2 className={styles.sectionTitle}><User size={24} /> 1. Datos Personales</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="nombres">Nombres y Apellidos Completos *</label>
            <input 
              type="text" 
              id="nombres" 
              name="nombres" 
              required 
              value={formData.nombres} 
              onChange={handleChange} 
              placeholder="Ej. Andrés Bello" 
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cedula">Cédula de Identidad *</label>
            <input 
              type="text" 
              id="cedula" 
              name="cedula" 
              required 
              value={formData.cedula} 
              onChange={handleCedulaChange} 
              placeholder="V-12.345.678" 
            />
            {formData.cedula && !validateCedula(formData.cedula) && (
              <small style={{ color: 'var(--error-color)', display: 'block', marginTop: '0.4rem' }}>
                Formato inválido. Debe comenzar con V- o E- seguido del número de cédula.
              </small>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="fechaNacimiento">Fecha de Nacimiento *</label>
            <input 
              type="date" 
              id="fechaNacimiento" 
              name="fechaNacimiento" 
              required 
              value={formData.fechaNacimiento} 
              onChange={handleChange} 
              min={minDate} 
              max={maxDate} 
            />
            {formData.fechaNacimiento && (
              <div style={{ marginTop: '0.5rem' }}>
                {age >= 18 && age <= 25 ? (
                  <span style={{ color: 'var(--success-color)', fontSize: '0.88rem', fontWeight: 600 }}>
                    ✓ Rango ideal de captación ({age} años)
                  </span>
                ) : age >= 15 && age <= 30 ? (
                  <span style={{ color: 'var(--warning-color)', fontSize: '0.88rem', fontWeight: 600 }}>
                    ⚠ Rango juvenil extendido ({age} años)
                  </span>
                ) : (
                  <span style={{ color: 'var(--error-color)', fontSize: '0.88rem', fontWeight: 600 }}>
                    ✗ Rango inválido ({age} años). Solo se permite entre 15 y 30 años.
                  </span>
                )}
              </div>
            )}
            <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem', display: 'block' }}>
              Registro exclusivo para jóvenes entre 15 y 30 años de edad.
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="telefono">Número de Teléfono (WhatsApp o Telegram) *</label>
            <input 
              type="tel" 
              id="telefono" 
              name="telefono" 
              required 
              value={formData.telefono} 
              onChange={handlePhoneChange} 
              placeholder="0414-1234567" 
            />
            {formData.telefono && !validatePhone(formData.telefono) && (
              <small style={{ color: 'var(--error-color)', display: 'block', marginTop: '0.4rem' }}>
                Debe ser un número móvil venezolano válido (ej: 0412, 0414, 0424, 0416, 0426) con 7 dígitos restantes.
              </small>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="redesSociales">Redes Sociales (X / Instagram)</label>
            <input 
              type="text" 
              id="redesSociales" 
              name="redesSociales" 
              value={formData.redesSociales} 
              onChange={handleChange} 
              placeholder="@usuario" 
            />
          </div>

          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              className={styles.submitButton} 
              onClick={nextStep} 
              disabled={!isStep1Valid()}
            >
              Siguiente <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: UBICACIÓN TERRITORIAL */}
      {currentStep === 2 && (
        <div className={styles.formStep}>
          <h2 className={styles.sectionTitle}><MapPin size={24} /> 2. Ubicación Territorial</h2>

          <div className={styles.formGroup}>
            <label htmlFor="parroquia">Parroquia de Residencia *</label>
            <select 
              id="parroquia" 
              name="parroquia" 
              required 
              value={formData.parroquia} 
              onChange={handleChange}
            >
              <option value="" disabled>Selecciona tu parroquia</option>
              <option value="Los Teques">Los Teques</option>
              <option value="Altagracia de la Montaña">Altagracia de la Montaña</option>
              <option value="Cecilio Acosta">Cecilio Acosta</option>
              <option value="El Jarillo">El Jarillo</option>
              <option value="Paracotos">Paracotos</option>
              <option value="San Pedro">San Pedro</option>
              <option value="Tácata">Tácata</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sector">Sector / Comunidad *</label>
            <input 
              type="text" 
              id="sector" 
              name="sector" 
              required 
              value={formData.sector} 
              onChange={handleChange} 
              placeholder="Ej. El Paso, La Matica, Retamal, etc." 
            />
          </div>

          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              className={`${styles.navButton} ${styles.navButtonSecondary}`} 
              onClick={prevStep}
            >
              <ChevronLeft size={18} /> Atrás
            </button>
            <button 
              type="button" 
              className={styles.submitButton} 
              onClick={nextStep} 
              disabled={!isStep2Valid()}
            >
              Siguiente <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: INTELIGENCIA ELECTORAL */}
      {currentStep === 3 && (
        <div className={styles.formStep}>
          <h2 className={styles.sectionTitle}><Target size={24} /> 3. Inteligencia Electoral</h2>

          <div className={styles.formGroup}>
            <label>¿Estás inscrito en el Registro Electoral? *</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="inscritoRE" 
                  value="Sí" 
                  required 
                  checked={formData.inscritoRE === 'Sí'} 
                  onChange={handleChange} 
                /> Sí
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="inscritoRE" 
                  value="No" 
                  required 
                  checked={formData.inscritoRE === 'No'} 
                  onChange={handleChange} 
                /> No
              </label>
            </div>
          </div>

          {formData.inscritoRE === 'Sí' && (
            <div className={styles.formStep}>
              <div className={styles.formGroup}>
                <label htmlFor="centroVotacion">¿Cuál es tu Centro de Votación exacto? *</label>
                <input 
                  type="text" 
                  id="centroVotacion" 
                  name="centroVotacion" 
                  required={formData.inscritoRE === 'Sí'} 
                  value={formData.centroVotacion} 
                  onChange={handleChange} 
                  placeholder="Ej. U.E. Nacional Julio Rosales" 
                />
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>¿Formas parte o estás dispuesto a integrarte a la Red 600K para la defensa del voto? *</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="red600k" 
                  value="Sí" 
                  required 
                  checked={formData.red600k === 'Sí'} 
                  onChange={handleChange} 
                /> Sí, me interesa integrarme
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="red600k" 
                  value="No" 
                  required 
                  checked={formData.red600k === 'No'} 
                  onChange={handleChange} 
                /> No por ahora
              </label>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              className={`${styles.navButton} ${styles.navButtonSecondary}`} 
              onClick={prevStep}
            >
              <ChevronLeft size={18} /> Atrás
            </button>
            <button 
              type="button" 
              className={styles.submitButton} 
              onClick={nextStep} 
              disabled={!isStep3Valid()}
            >
              Siguiente <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: HABILIDADES Y COMPROMISO */}
      {currentStep === 4 && (
        <div className={styles.formStep}>
          <h2 className={styles.sectionTitle}><ShieldAlert size={24} /> 4. Habilidades y Compromiso Táctico</h2>

          <div className={styles.formGroup}>
            <label>¿En qué área operativa puedes aportar trabajo real a Vente Joven Guaicaipuro?</label>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  value="Activismo de calle y movilización" 
                  checked={formData.areasTrabajo.includes('Activismo de calle y movilización')} 
                  onChange={handleCheckboxChange} 
                /> Activismo de calle y movilización
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  value="Estructura electoral (Testigo / Miembro de Mesa)" 
                  checked={formData.areasTrabajo.includes('Estructura electoral (Testigo / Miembro de Mesa)')} 
                  onChange={handleCheckboxChange} 
                /> Estructura electoral (Testigo / Miembro de Mesa)
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  value="Comunicaciones y Redes Sociales" 
                  checked={formData.areasTrabajo.includes('Comunicaciones y Redes Sociales')} 
                  onChange={handleCheckboxChange} 
                /> Comunicaciones y Redes Sociales
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  value="Logística y Organización" 
                  checked={formData.areasTrabajo.includes('Logística y Organización')} 
                  onChange={handleCheckboxChange} 
                /> Logística y Organización
              </label>
            </div>
          </div>

          <div className={styles.decálogoBox}>
            <p><strong>Filtro Ideológico y Compromiso de Valores:</strong></p>
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: 500, lineHeight: 1.5, fontSize: '0.92rem' }}>
                "En Vente Venezuela creemos en el mérito, la propiedad privada y la libertad individual como la única vía para romper definitivamente con el modelo socialista. ¿Estás dispuesto a formarte, defender las ideas de la libertad y asumir un activismo frontal, para construir un país de oportunidades?" *
              </label>
              
              <div className={styles.radioGroup} style={{ marginTop: '1rem' }}>
                <label className={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name="compromisoDecalogo" 
                    value="Sí, asumo el compromiso." 
                    required 
                    checked={formData.compromisoDecalogo === 'Sí, asumo el compromiso.'} 
                    onChange={handleChange} 
                  /> Sí, asumo el compromiso con la libertad.
                </label>
                <label className={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name="compromisoDecalogo" 
                    value="No." 
                    required 
                    checked={formData.compromisoDecalogo === 'No.'} 
                    onChange={handleChange} 
                  /> No asumo el compromiso.
                </label>
              </div>
            </div>
          </div>

          {/* Bloqueo del Decálogo */}
          {formData.compromisoDecalogo === 'No.' && (
            <div className={styles.errorBox} style={{ marginBottom: '1.5rem' }}>
              <AlertTriangle size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
              <strong>Acceso Restringido:</strong> Para registrarse en Vente Joven Guaicaipuro es requisito indispensable asumir el compromiso y la defensa de los principios de libertad individual y propiedad privada del movimiento.
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                required 
                checked={privacyAccepted} 
                onChange={(e) => setPrivacyAccepted(e.target.checked)} 
              />
              Acepto el tratamiento seguro de mis datos.
            </label>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
              Tus datos serán confidenciales y procesados únicamente por la Coordinación Juvenil Municipal para el trabajo de organización.
            </small>
          </div>

          {submissionError && (
            <div className={styles.errorBox} style={{ marginBottom: '1.5rem' }}>
              <strong>Error al enviar:</strong> {submissionError}
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              className={`${styles.navButton} ${styles.navButtonSecondary}`} 
              onClick={prevStep}
              disabled={isSubmitting}
            >
              <ChevronLeft size={18} /> Atrás
            </button>
            <button 
              type="submit" 
              className={styles.submitButton} 
              disabled={!isStep4Valid() || isSubmitting || !isConfigured}
            >
              {isSubmitting ? (
                'Procesando...'
              ) : (
                <>
                  <Send size={18} /> Enviar Registro
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </form>
  );
}