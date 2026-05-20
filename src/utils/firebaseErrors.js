const ERROR_MESSAGES = {
  'auth/email-already-in-use':   'Este correo ya está registrado.',
  'auth/invalid-email':          'El correo no es válido.',
  'auth/weak-password':          'La contraseña debe tener al menos 6 caracteres.',
  'auth/user-not-found':         'No existe una cuenta con este correo.',
  'auth/wrong-password':         'Contraseña incorrecta.',
  'auth/invalid-credential':     'Correo o contraseña incorrectos.',
  'auth/too-many-requests':      'Demasiados intentos. Intenta más tarde.',
  'auth/popup-closed-by-user':   'Cerraste la ventana de Google antes de completar.',
}

export function getAuthErrorMessage(error) {
  return ERROR_MESSAGES[error.code] ?? 'Ocurrió un error inesperado. Intenta de nuevo.'
}
