/**
 * Compara dos cadenas de tiempo en formato HH:MM.
 * Retorna un valor negativo si t1 < t2, 0 si son iguales, y positivo si t1 > t2.
 */
export const compareTimes = (t1, t2) => {
  const [h1, m1] = t1.split(':').map(Number);
  const [h2, m2] = t2.split(':').map(Number);
  if (h1 !== h2) return h1 - h2;
  return m1 - m2;
};

/**
 * Verifica si dos intervalos de tiempo [s1, e1] y [s2, e2] se cruzan.
 * Los intervalos se cruzan si max(s1, s2) < min(e1, e2).
 */
export const isTimeOverlapping = (s1, e1, s2, e2) => {
  // s1 < e2 && s2 < e1
  return compareTimes(s1, e2) < 0 && compareTimes(s2, e1) < 0;
};

/**
 * Valida una reserva propuesta frente a una lista de reservas existentes.
 * Retorna la reserva en conflicto si se detecta un cruce de horarios, o null si está libre.
 */
export const checkReservationOverlap = (newRes, reservations) => {
  const newWorkspaceId = Number(newRes.workspaceId);
  const newDate = newRes.date;
  const newStart = newRes.startTime;
  const newEnd = newRes.endTime;
  const newId = newRes.id ? Number(newRes.id) : null;

  for (const res of reservations) {
    // Omitir si es la misma reserva que se está editando
    if (newId && Number(res.id) === newId) {
      continue;
    }

    // Omitir si la reserva está cancelada o rechazada
    if (res.status === 'Cancelled' || res.status === 'Rejected') {
      continue;
    }

    // Verificar si coincide el mismo espacio y fecha
    if (Number(res.workspaceId) === newWorkspaceId && res.date === newDate) {
      if (isTimeOverlapping(newStart, newEnd, res.startTime, res.endTime)) {
        return res;
      }
    }
  }

  return null;
};
