const MAP = {
  'Invalid login credentials':           'Correo o contraseña incorrectos.',
  'Email not confirmed':                  'Confirma tu correo antes de ingresar.',
  'User already registered':             'Este correo ya está registrado.',
  'Password should be at least 6 characters': 'La contraseña debe tener mínimo 6 caracteres.',
  'Unable to validate email address':    'El formato del correo no es válido.',
  'Email rate limit exceeded':           'Demasiados intentos. Espera unos minutos.',
  'signup_disabled':                     'El registro está deshabilitado temporalmente.',
}

export function getAuthErrorMessage(err) {
  const msg = err?.message ?? String(err)
  for (const [key, val] of Object.entries(MAP)) {
    if (msg.includes(key)) return val
  }
  return msg || 'Ocurrió un error. Intenta de nuevo.'
}
