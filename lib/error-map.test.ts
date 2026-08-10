import { describe, it, expect } from 'vitest';
import { mapAuthError } from './error-map';

describe('mapAuthError', () => {
    it('returns the correct message for invalid credentials / wrong password / user not found', () => {
        const expected = 'El correo o la contraseña no son correctos.';
        expect(mapAuthError('auth/invalid-credential')).toBe(expected);
        expect(mapAuthError('auth/wrong-password')).toBe(expected);
        expect(mapAuthError('auth/user-not-found')).toBe(expected);
    });

    it('returns the correct message for email already in use', () => {
        expect(mapAuthError('auth/email-already-in-use')).toBe('Este correo electrónico ya está registrado. Prueba con otro o inicia sesión.');
    });

    it('returns the correct message for weak password', () => {
        expect(mapAuthError('auth/weak-password')).toBe('La contraseña es muy débil. Debe tener al menos 6 caracteres.');
    });

    it('returns the correct message for invalid email format', () => {
        expect(mapAuthError('auth/invalid-email')).toBe('El formato del correo electrónico no es válido.');
    });

    it('returns the correct message for disabled user', () => {
        expect(mapAuthError('auth/user-disabled')).toBe('Esta cuenta ha sido deshabilitada por seguridad.');
    });

    it('returns the correct message for operation not allowed', () => {
        expect(mapAuthError('auth/operation-not-allowed')).toBe('El inicio de sesión con este método no está habilitado actualmente.');
    });

    it('returns the correct message for too many requests', () => {
        expect(mapAuthError('auth/too-many-requests')).toBe('Demasiados intentos fallidos. Por favor, intenta de nuevo en unos minutos.');
    });

    it('returns the correct message for network request failed', () => {
        expect(mapAuthError('auth/network-request-failed')).toBe('Error de conexión. Revisa tu internet e intenta de nuevo.');
    });

    it('returns the correct message for popup closed by user', () => {
        expect(mapAuthError('auth/popup-closed-by-user')).toBe('Se cerró la ventana de Google antes de completar el inicio de sesión.');
    });

    it('returns a generic error message for unknown error codes', () => {
        const expected = 'Ocurrió un error inesperado al validar tus datos. Intenta de nuevo.';
        expect(mapAuthError('auth/unknown-error')).toBe(expected);
        expect(mapAuthError('random-string')).toBe(expected);
        expect(mapAuthError('')).toBe(expected);
    });
});
