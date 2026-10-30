// -------------------- DATA MOCK (estructura conforme a DDL) --------------------

// Definición de los cargos disponibles en el sistema
const cargos = [
  { id_cargo: 1, nom_cargo: "Instructor" },
  { id_cargo: 2, nom_cargo: "Coordinador" },
  { id_cargo: 3, nom_cargo: "Líder de Área" }
];

// Definición de los programas disponibles para las fichas
let programas = [
  { id_programa_titul: 101, nom_programa_titul: "Técnico en Software", tip_programa_titul: "Tn" },
  { id_programa_titul: 102, nom_programa_titul: "Tecnólogo en Redes", tip_programa_titul: "To" },
  { id_programa_titul: 103, nom_programa_titul: "Tecnólogo en Análisis y Desarrollo de Software", tip_programa_titul: "To" }
];

// Definición de los ambientes físicos para las fichas
let ambientes = [
  { id_ambiente: 1, nom_ambiente: "Lab TI 101" },
  { id_ambiente: 2, nom_ambiente: "Aula Empresarial" },
  { id_ambiente: 3, nom_ambiente: "Centro de Simulación" }
];

// Tablas principales
let instructores = [];
let competencias = [];
let instructorCompetencias = [];
let fichasTituladas = [];

// -------------------- FUNCIONES DE PERSISTENCIA (con cifrado) --------------------
// Clave secreta para cifrar/descifrar lo que se guarda en localStorage.
// NOTA PEDAGÓGICA: al estar en el código del navegador, cualquiera puede leerla con DevTools.
// En producción la clave nunca va en el cliente: se gestiona desde un backend o un gestor de secretos.
const CLAVE_SECRETA = 'MiClave$1234';

// Nombre de la clave bajo la cual se guarda todo el estado en localStorage
const STORAGE_KEY = 'sapfpiDB';

/**
 * Cifra un objeto JavaScript con XOR + Base64.
 * Flujo: objeto -> JSON -> encodeURIComponent (ASCII seguro) -> XOR con la clave (cíclica) -> btoa.
 * @param {Object} data  - Objeto a proteger
 * @param {string} clave - Clave secreta
 * @returns {string} Cadena cifrada en Base64
 */
function cifrarDatos(data, clave) {
  // encodeURIComponent deja solo caracteres ASCII, así tildes y ñ no rompen btoa()
  const texto = encodeURIComponent(JSON.stringify(data));
  let cifrado = '';
  for (let i = 0; i < texto.length; i++) {
    // XOR carácter a carácter; la clave se repite con el operador módulo
    cifrado += String.fromCharCode(texto.charCodeAt(i) ^ clave.charCodeAt(i % clave.length));
  }
  return btoa(cifrado);
}

/**
 * Proceso inverso a cifrarDatos().
 * Si la clave es incorrecta o el dato está corrupto, limpia el localStorage y devuelve null.
 * @param {string} dataEncriptado - Cadena Base64 cifrada
 * @param {string} clave          - Clave secreta
 * @returns {Object|null} Objeto original, o null si falla el descifrado
 */
function descifrarDatos(dataEncriptado, clave) {
  try {
    const texto = atob(dataEncriptado);
    let descifrado = '';
    for (let i = 0; i < texto.length; i++) {
      // XOR es reversible: aplicarlo de nuevo con la misma clave devuelve el original
      descifrado += String.fromCharCode(texto.charCodeAt(i) ^ clave.charCodeAt(i % clave.length));
    }
    return JSON.parse(decodeURIComponent(descifrado));
  } catch (e) {
    console.error('Descifrado fallido: clave incorrecta o datos corruptos.', e);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Guarda el estado completo de la aplicación en localStorage, cifrado.
 */
function guardarDatos() {
  const data = { instructores, competencias, instructorCompetencias, fichasTituladas, programas, ambientes };
  localStorage.setItem(STORAGE_KEY, cifrarDatos(data, CLAVE_SECRETA));
}

/**
 * Carga el estado desde localStorage (descifrándolo). Si no hay datos, o no se pueden
 * descifrar, usa los datos semilla por defecto.
 */
function cargarDatosIniciales() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = descifrarDatos(stored, CLAVE_SECRETA);
    if (parsed) {
      // Carga los valores en las variables globales, con arreglos vacíos como respaldo
      instructores = parsed.instructores || [];
      competencias = parsed.competencias || [];
      instructorCompetencias = parsed.instructorCompetencias || [];
      fichasTituladas = parsed.fichasTituladas || [];
      programas = parsed.programas || programas;
      ambientes = parsed.ambientes || ambientes;
      return;
    }
  }

  // Datos semilla por defecto
  instructores = [
    { id_instruc: 1001, nom_instruc: "Ana", apelli_instruc: "García", tele_instruc: "3001234567", correo_instruc: "ana.garcia@sena.edu", id_cargo: 1, ind_planta: true, ind_lider_ficha: true, ind_estado: true, ind_disponib: true },
    { id_instruc: 1002, nom_instruc: "Carlos", apelli_instruc: "Mendoza", tele_instruc: "3109876543", correo_instruc: "carlos.m@sena.edu", id_cargo: 1, ind_planta: false, ind_lider_ficha: false, ind_estado: true, ind_disponib: true },
    { id_instruc: 1003, nom_instruc: "Laura", apelli_instruc: "Rojas", tele_instruc: "3204567890", correo_instruc: "laura.rojas@sena.edu", id_cargo: 1, ind_planta: true, ind_lider_ficha: true, ind_estado: true, ind_disponib: true }
  ];
  competencias = [
    { id_competen: 101, nom_competen: "Programación Básica", ind_tipo_competen: "Tn", val_duracion_competen: 48 },
    { id_competen: 102, nom_competen: "Bases de Datos", ind_tipo_competen: "Tn", val_duracion_competen: 40 },
    { id_competen: 103, nom_competen: "Ética y Valores", ind_tipo_competen: "Tr", val_duracion_competen: 16 }
  ];
  instructorCompetencias = [
    { id_instruc: 1001, id_competen: 101 },
    { id_instruc: 1002, id_competen: 102 },
    { id_instruc: 1001, id_competen: 103 }
  ];
  fichasTituladas = [
    { id_ficha: 2700001, id_programa_titul: 101, ind_jornada: "M", id_instruc_lider: 1001, id_ambiente: 1, fec_ini: "2025-02-10", fec_fin: "2025-11-30", ind_modalidad: "P", fec_ini_etapa_produc: "2025-09-01", ind_etapa_produc: false },
    { id_ficha: 2700002, id_programa_titul: 102, ind_jornada: "T", id_instruc_lider: 1003, id_ambiente: 2, fec_ini: "2025-03-01", fec_fin: "2025-12-15", ind_modalidad: "P", fec_ini_etapa_produc: "2025-10-01", ind_etapa_produc: false }
  ];
}

// -------------------- FUNCIÓN PARA ESCAPAR HTML (XSS) --------------------
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    if (m === "'") return '&#039;';
    return m;
  });
}

// -------------------- VALIDACIONES --------------------
// Importante: validar mejora la calidad del dato, pero NO reemplaza a escapeHTML().
// La defensa contra XSS es escapar al pintar; la validación es la primera barrera, no la única.
// Los límites numéricos coinciden con el DDL (tab_instructores / tab_competencias).

/**
 * Valida texto general (nombres de competencias, notas, etc.).
 * Permite letras (con acentos, ü y ñ), números, espacios y puntuación básica.
 * @param {string} text
 * @returns {boolean}
 */
function isValidText(text) {
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s.,\-_()\/:]+$/;
  return regex.test(text);
}

/**
 * Valida nombres y apellidos de personas: solo letras, espacios, apóstrofo, punto y guion
 * (admite "Güiza", "O'Brien", "María-José"). No admite números.
 * @param {string} text
 * @returns {boolean}
 */
function isValidName(text) {
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'.\-]+$/;
  return regex.test(text);
}

/**
 * Valida los datos de un instructor antes de guardarlos.
 * @returns {{ok: boolean, error?: string}}
 */
function validateInstructorInput(id, nom, ape, tel, correo) {
  // id_instruc es DECIMAL(11,0): entero positivo de máximo 11 dígitos
  if (!Number.isInteger(id) || id <= 0 || id > 99999999999) {
    return { ok: false, error: 'El ID debe ser un entero positivo de máximo 11 dígitos.' };
  }
  if (!nom || !ape || !correo) {
    return { ok: false, error: 'Complete los campos obligatorios (nombres, apellidos, correo).' };
  }
  if (!isValidName(nom) || nom.length > 60) {
    return { ok: false, error: 'Los nombres contienen caracteres no permitidos (solo letras, máx. 60).' };
  }
  if (!isValidName(ape) || ape.length > 60) {
    return { ok: false, error: 'Los apellidos contienen caracteres no permitidos (solo letras, máx. 60).' };
  }
  // tele_instruc es DECIMAL(10,0): máximo 10 dígitos
  if (!/^\d{7,10}$/.test(tel)) {
    return { ok: false, error: 'El teléfono debe contener únicamente números (entre 7 y 10 dígitos).' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { ok: false, error: 'Correo electrónico no válido.' };
  }
  return { ok: true };
}

/**
 * Valida los datos de una competencia antes de guardarlos.
 * @returns {{ok: boolean, error?: string}}
 */
function validateCompetenciaInput(id, nom, dur) {
  if (!Number.isInteger(id) || id <= 0 || id > 99999999999) {
    return { ok: false, error: 'El ID debe ser un entero positivo de máximo 11 dígitos.' };
  }
  if (!nom || !isValidText(nom) || nom.length > 100) {
    return { ok: false, error: 'El nombre de la competencia contiene caracteres no permitidos (máx. 100).' };
  }
  // val_duracion_competen es DECIMAL(3,0): entre 1 y 999 horas
  if (!Number.isInteger(dur) || dur < 1 || dur > 999) {
    return { ok: false, error: 'La duración debe ser un número entero entre 1 y 999 horas.' };
  }
  return { ok: true };
}

// -------------------- RENDER PRINCIPAL --------------------
function renderAll() {
  renderInstructores();
  renderCompetencias();
  renderAsignaciones();
  renderFichas();
  actualizarSelectsAsignacion();
}

function getCargoNombre(id_cargo) {
  const c = cargos.find(c => c.id_cargo === id_cargo);
  return c ? c.nom_cargo : "Instructor";
}

// -------------------- INSTRUCTORES --------------------
/**
 * Renderiza la tabla de instructores a partir del arreglo 'instructores'.
 * Añade filas dinámicamente al tbody correspondiente y asigna los botones de acción.
 */
function renderInstructores() {
  // Obtiene el cuerpo de la tabla de instructores
  const tbody = document.getElementById('instructoresTbody');
  // Limpia el contenido actual del tbody
  tbody.innerHTML = '';

  // Itera sobre cada instructor del arreglo para crear una fila por instructor
  instructores.forEach(inst => {
    // Inserta una nueva fila por cada instructor
    const row = tbody.insertRow();

    // Celda 0: ID del instructor
    row.insertCell(0).innerText = inst.id_instruc;
    // Celda 1: Nombre completo (nombre + apellido)
    row.insertCell(1).innerText = `${inst.nom_instruc} ${inst.apelli_instruc}`;
    // Celda 2: Teléfono
    row.insertCell(2).innerText = inst.tele_instruc;
    // Celda 3: Correo electrónico
    row.insertCell(3).innerText = inst.correo_instruc;
    // Celda 4: Cargo del instructor (obtiene nombre a partir del id_cargo)
    row.insertCell(4).innerText = getCargoNombre(inst.id_cargo);
    // Celda 5: Tipo de contratación (Planta o Contrato)
    row.insertCell(5).innerHTML = inst.ind_planta ? '<span class="badge">Planta</span>' : '<span class="badge">Contrato</span>';
    // Celda 6: Indicador de líder de ficha
    row.insertCell(6).innerHTML = inst.ind_lider_ficha ?
      '<i class="fas fa-check-circle" style="color:green"></i>' :
      '<i class="fas fa-times-circle" style="color:gray"></i>';
    // Celda 7: Botones de acción (editar y eliminar)
    const accel = row.insertCell(7);
    accel.className = "action-group";
    accel.innerHTML = `<button class="icon-btn edit" data-id="${inst.id_instruc}" data-type="instructor"><i class="fas fa-edit"></i></button>
                       <button class="icon-btn delete" data-id="${inst.id_instruc}" data-type="instructor"><i class="fas fa-trash-alt"></i></button>`;
  });

  // Las filas se recrean en cada render, así que los botones son nuevos y no hay handlers duplicados
  document.querySelectorAll('#instructoresTbody .icon-btn.edit').forEach(btn => btn.addEventListener('click', handleEditInstructor));
  document.querySelectorAll('#instructoresTbody .icon-btn.delete').forEach(btn => btn.addEventListener('click', handleDeleteInstructor));
}

/**
 * Maneja el evento de edición de instructor, abre el modal de edición correspondiente.
 * @param {Event} e - Evento de click en el botón de editar.
 */
function handleEditInstructor(e) {
  // Obtiene el ID del instructor a partir del atributo data-id del botón
  const id = parseInt(e.currentTarget.getAttribute('data-id'));
  // Busca el instructor en el arreglo de instructores
  const instructor = instructores.find(i => i.id_instruc === id);
  // Si existe, abre el modal pre-llenado con su información
  if (instructor) abrirModalInstructor(instructor);
}

/**
 * Maneja el evento de eliminar instructor.
 * Solicita confirmación, elimina el instructor correspondiente, 
 * elimina sus asignaciones y actualiza las fichas lideradas por él.
 * @param {Event} e - Evento de click en el botón de borrar.
 */
function handleDeleteInstructor(e) {
  // Obtiene el ID del instructor a eliminar
  const id = parseInt(e.currentTarget.getAttribute('data-id'));
  // Solicita confirmación antes de eliminar
  if (confirm("Eliminar instructor también removerá asignaciones y lo dejará como líder de fichas (null).")) {
    // Filtra el instructor del arreglo principal
    instructores = instructores.filter(i => i.id_instruc !== id);
    // Elimina asignaciones relacionadas
    instructorCompetencias = instructorCompetencias.filter(asig => asig.id_instruc !== id);
    // Actualiza fichas donde era líder, asignando null al campo líder
    fichasTituladas = fichasTituladas.map(f => f.id_instruc_lider === id ? { ...f, id_instruc_lider: null } : f);
    // Guarda los datos actualizados en almacenamiento
    guardarDatos();
    // Re-renderiza todas las vistas
    renderAll();
  }
}

// Modal de instructor (con escape HTML)
function abrirModalInstructor(instructor = null) {
  const isEdit = instructor !== null;
  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal-overlay';
  // Escapamos los valores para evitar XSS
  const idValue = isEdit ? instructor.id_instruc : '';
  const nomValue = isEdit ? escapeHTML(instructor.nom_instruc) : '';
  const apeValue = isEdit ? escapeHTML(instructor.apelli_instruc) : '';
  const telValue = isEdit ? escapeHTML(String(instructor.tele_instruc)) : '';
  const correoValue = isEdit ? escapeHTML(instructor.correo_instruc) : '';
  const checkedPlanta = isEdit && instructor.ind_planta ? 'checked' : '';
  const checkedLider = isEdit && instructor.ind_lider_ficha ? 'checked' : '';

  modalDiv.innerHTML = `
    <div class="modal-card">
      <h3>${isEdit ? 'Editar Instructor' : 'Nuevo Instructor'}</h3>
      <div class="form-group"><label>ID Instructor</label><input id="modalIdInst" type="number" value="${idValue}" ${isEdit ? 'readonly' : ''}></div>
      <div class="form-group"><label>Nombres</label><input id="modalNom" value="${nomValue}"></div>
      <div class="form-group"><label>Apellidos</label><input id="modalApe" value="${apeValue}"></div>
      <div class="form-group"><label>Teléfono</label><input id="modalTel" value="${telValue}"></div>
      <div class="form-group"><label>Correo</label><input id="modalCorreo" type="email" value="${correoValue}"></div>
      <div class="form-group"><label>Cargo</label><select id="modalCargo">${cargos.map(c => `<option value="${c.id_cargo}" ${isEdit && instructor.id_cargo == c.id_cargo ? 'selected' : ''}>${escapeHTML(c.nom_cargo)}</option>`).join('')}</select></div>
      <div class="form-group"><label><input type="checkbox" id="modalPlanta" ${checkedPlanta}> Instructor de planta</label></div>
      <div class="form-group"><label><input type="checkbox" id="modalLider" ${checkedLider}> Líder de ficha</label></div>
      <div class="flex-buttons"><button class="btn-secondary" id="modalCancel">Cancelar</button><button class="btn-primary" id="modalSave">Guardar</button></div>
    </div>
  `;
  document.body.appendChild(modalDiv);
  const cancelBtn = modalDiv.querySelector('#modalCancel');
  const saveBtn = modalDiv.querySelector('#modalSave');
  cancelBtn.onclick = () => modalDiv.remove();

  saveBtn.onclick = () => {
    const id = parseInt(modalDiv.querySelector('#modalIdInst').value);
    let nom = modalDiv.querySelector('#modalNom').value.trim();
    let ape = modalDiv.querySelector('#modalApe').value.trim();
    let tel = modalDiv.querySelector('#modalTel').value.trim();
    let correo = modalDiv.querySelector('#modalCorreo').value.trim();
    const idCargo = parseInt(modalDiv.querySelector('#modalCargo').value);
    const planta = modalDiv.querySelector('#modalPlanta').checked;
    const liderFicha = modalDiv.querySelector('#modalLider').checked;

    // Validaciones (formato y rangos); la unicidad del ID se revisa aparte
    const validacion = validateInstructorInput(id, nom, ape, tel, correo);
    if (!validacion.ok) { alert(validacion.error); return; }
    if (!isEdit && instructores.some(i => i.id_instruc === id)) { alert("ID instructor ya existe."); return; }

    // Al editar se parte del instructor existente para no perder campos que el formulario no muestra
    const base = isEdit ? instructor : { ind_estado: true, ind_disponib: true };
    const nuevoInstructor = {
      ...base,
      id_instruc: id, nom_instruc: nom, apelli_instruc: ape, tele_instruc: tel,
      correo_instruc: correo, id_cargo: idCargo,
      ind_planta: planta, ind_lider_ficha: liderFicha
    };
    if (isEdit) {
      const index = instructores.findIndex(i => i.id_instruc === id);
      if (index !== -1) instructores[index] = { ...nuevoInstructor };
    } else {
      instructores.push(nuevoInstructor);
    }
    guardarDatos();
    renderAll();
    modalDiv.remove();
  };
}

// -------------------- COMPETENCIAS --------------------
/**
 * Renderiza la tabla de competencias en el DOM.
 * Por cada competencia en el array `competencias`:
 *  - Crea una fila en la tabla con sus respectivos datos (id, nombre, tipo y duración).
 *  - Agrega botones para editar y eliminar cada competencia.
 * Además, añade listeners a los botones para manejar las acciones de edición y eliminación.
 */

function renderCompetencias() {
  const tbody = document.getElementById('competenciasTbody');
  tbody.innerHTML = '';
  // Recorre la lista de competencias y genera las filas de la tabla
  competencias.forEach(c => {
    const row = tbody.insertRow();
    // Celda ID
    row.insertCell(0).innerText = c.id_competen;
    // Celda Nombre
    row.insertCell(1).innerText = c.nom_competen;
    // Celda Tipo (descripción humana)
    row.insertCell(2).innerHTML = c.ind_tipo_competen === 'Tn' ? 'Técnica' : 'Transversal';
    // Celda Duración
    row.insertCell(3).innerText = c.val_duracion_competen;
    // Celda de acciones (botones editar/eliminar)
    const accel = row.insertCell(4);
    accel.innerHTML = `<button class="icon-btn edit" data-id="${c.id_competen}" data-type="competen"><i class="fas fa-edit"></i></button>
                       <button class="icon-btn delete" data-id="${c.id_competen}" data-type="competen"><i class="fas fa-trash-alt"></i></button>`;
  });

  // Listener para botón de editar competencia
  document.querySelectorAll('#competenciasTbody .icon-btn.edit').forEach(btn =>
    btn.addEventListener('click', e => {
      const id = parseInt(btn.dataset.id);
      const comp = competencias.find(c => c.id_competen === id);
      if (comp) abrirModalCompetencia(comp);
    })
  );

  // Listener para botón de eliminar competencia
  document.querySelectorAll('#competenciasTbody .icon-btn.delete').forEach(btn =>
    btn.addEventListener('click', e => {
      if (confirm("Eliminar competencia? Se borran asignaciones asociadas")) {
        const id = parseInt(btn.dataset.id);
        // Elimina la competencia y las asignaciones relacionadas a esta competencia
        competencias = competencias.filter(c => c.id_competen !== id);
        instructorCompetencias = instructorCompetencias.filter(a => a.id_competen !== id);
        guardarDatos(); // Persiste los cambios
        renderAll();    // Actualiza la vista
      }
    })
  );
}

/**
 * Abre un modal (ventana emergente) para crear o editar una competencia.
 * Si recibe una competencia (`comp`), el formulario se llena con los datos existentes para edición.
 * Si no, el formulario está vacío para ingreso de una nueva competencia.
 * Valida datos antes de guardar y actualiza la lista de competencias.
 * @param {Object|null} comp - Objeto competencia para editar, o `null` para nueva competencia.
 */
function abrirModalCompetencia(comp = null) {
  const isEdit = !!comp; // Determina si es edición o creación
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  // Pre-carga valores si viene una competencia para editar
  const idValue = isEdit ? comp.id_competen : '';
  const nomValue = isEdit ? escapeHTML(comp.nom_competen) : '';
  const durValue = isEdit ? comp.val_duracion_competen : '';

  // Estructura HTML del modal
  modal.innerHTML = `
    <div class="modal-card"><h3>${isEdit ? 'Editar Competencia' : 'Nueva Competencia'}</h3>
    <div class="form-group"><label>ID</label><input id="compId" type="number" value="${idValue}" ${isEdit ? 'readonly' : ''}></div>
    <div class="form-group"><label>Nombre</label><input id="compNom" value="${nomValue}"></div>
    <div class="form-group"><label>Tipo</label>
      <select id="compTipo">
        <option value="Tn" ${isEdit && comp.ind_tipo_competen == 'Tn' ? 'selected' : ''}>Técnica (Tn)</option>
        <option value="Tr" ${isEdit && comp.ind_tipo_competen == 'Tr' ? 'selected' : ''}>Transversal (Tr)</option>
      </select>
    </div>
    <div class="form-group"><label>Duración (hrs)</label><input id="compDur" type="number" value="${durValue}"></div>
    <div class="flex-buttons"><button class="btn-secondary" id="cancelComp">Cancelar</button><button class="btn-primary" id="saveComp">Guardar</button></div>
    </div>`;
  document.body.appendChild(modal);

  // Cierra el modal sin guardar cambios
  modal.querySelector('#cancelComp').onclick = () => modal.remove();

  // Listener botón guardar: valida y guarda los datos
  modal.querySelector('#saveComp').onclick = () => {
    const id = parseInt(modal.querySelector('#compId').value);
    const nom = modal.querySelector('#compNom').value.trim();
    const tipo = modal.querySelector('#compTipo').value;
    const dur = parseInt(modal.querySelector('#compDur').value);

    // Validaciones de datos (formato y rangos)
    const validacion = validateCompetenciaInput(id, nom, dur);
    if (!validacion.ok) {
      alert(validacion.error);
      return;
    }
    if (!isEdit && competencias.some(c => c.id_competen === id)) {
      alert("ID competencia ya registrada.");
      return;
    }

    // Estructura del objeto competencia a guardar
    const nueva = { id_competen: id, nom_competen: nom, ind_tipo_competen: tipo, val_duracion_competen: dur };
    if (isEdit) {
      // Si es edición, reemplaza la competencia en la posición correspondiente
      const idx = competencias.findIndex(c => c.id_competen === id);
      if (idx !== -1) competencias[idx] = nueva;
    } else {
      // Si es nueva, la agrega al arreglo
      competencias.push(nueva);
    }
    guardarDatos();  // Persiste los cambios
    renderAll();     // Refresca la vista principal
    modal.remove();  // Cierra el modal
  };
}

// -------------------- ASIGNACIONES --------------------
function actualizarSelectsAsignacion() {
  const selectInst = document.getElementById('asignInstrucSelect');
  const selectComp = document.getElementById('asignCompetSelect');
  if (selectInst) selectInst.innerHTML = instructores.map(i => `<option value="${i.id_instruc}">${i.id_instruc} - ${escapeHTML(i.nom_instruc)} ${escapeHTML(i.apelli_instruc)}</option>`).join('');
  if (selectComp) selectComp.innerHTML = competencias.map(c => `<option value="${c.id_competen}">${c.id_competen} - ${escapeHTML(c.nom_competen)}</option>`).join('');
}

function renderAsignaciones() {
  const tbody = document.getElementById('asignacionesTbody');
  tbody.innerHTML = '';
  instructorCompetencias.forEach(asig => {
    const instructor = instructores.find(i => i.id_instruc === asig.id_instruc);
    const competencia = competencias.find(c => c.id_competen === asig.id_competen);
    if (!instructor || !competencia) return;
    const row = tbody.insertRow();
    row.insertCell(0).innerText = `${instructor.nom_instruc} ${instructor.apelli_instruc} (ID:${instructor.id_instruc})`;
    row.insertCell(1).innerText = `${competencia.nom_competen} (ID:${competencia.id_competen})`;
    const accel = row.insertCell(2);
    accel.innerHTML = `<button class="icon-btn delete" data-idinst="${asig.id_instruc}" data-idcomp="${asig.id_competen}"><i class="fas fa-trash-alt"></i></button>`;
  });

  document.querySelectorAll('#asignacionesTbody .icon-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idInst = parseInt(btn.dataset.idinst);
      const idComp = parseInt(btn.dataset.idcomp);
      instructorCompetencias = instructorCompetencias.filter(a => !(a.id_instruc === idInst && a.id_competen === idComp));
      guardarDatos();
      renderAll();  // Solo una llamada, ya que renderAll incluye renderAsignaciones
    });
  });
}

document.getElementById('btnAsignar')?.addEventListener('click', () => {
  const idInst = parseInt(document.getElementById('asignInstrucSelect').value);
  const idComp = parseInt(document.getElementById('asignCompetSelect').value);
  if (!idInst || !idComp) return alert("Seleccione ambos campos");
  if (instructorCompetencias.some(a => a.id_instruc === idInst && a.id_competen === idComp))
    return alert("Ya existe esa asignación");
  instructorCompetencias.push({ id_instruc: idInst, id_competen: idComp });
  guardarDatos();
  renderAll();
});

// -------------------- FICHAS --------------------
function renderFichas() {
  const tbody = document.getElementById('fichasTbody');
  tbody.innerHTML = '';
  fichasTituladas.forEach(f => {
    const programa = programas.find(p => p.id_programa_titul === f.id_programa_titul);
    const instructorLider = instructores.find(i => i.id_instruc === f.id_instruc_lider);
    const ambiente = ambientes.find(a => a.id_ambiente === f.id_ambiente);
    const row = tbody.insertRow();
    row.insertCell(0).innerText = f.id_ficha;
    row.insertCell(1).innerText = programa ? programa.nom_programa_titul : "N/A";
    row.insertCell(2).innerText = f.ind_jornada === 'M' ? 'Mañana' : (f.ind_jornada === 'T' ? 'Tarde' : 'Noche');
    row.insertCell(3).innerText = instructorLider ? `${instructorLider.nom_instruc} ${instructorLider.apelli_instruc}` : 'Sin líder';
    row.insertCell(4).innerText = ambiente ? ambiente.nom_ambiente : 'Sin ambiente';
    row.insertCell(5).innerText = f.fec_ini;
    row.insertCell(6).innerText = f.fec_fin;
    const accel = row.insertCell(7);
    accel.innerHTML = `<button class="icon-btn edit" data-idf="${f.id_ficha}"><i class="fas fa-edit"></i></button>
                       <button class="icon-btn delete" data-idf="${f.id_ficha}"><i class="fas fa-trash-alt"></i></button>`;
  });

  document.querySelectorAll('#fichasTbody .icon-btn.delete').forEach(btn =>
    btn.addEventListener('click', (e) => {
      if (!confirm("¿Eliminar la ficha?")) return;
      const idf = parseInt(btn.dataset.idf);
      fichasTituladas = fichasTituladas.filter(f => f.id_ficha !== idf);
      guardarDatos();
      renderFichas();
    })
  );
  document.querySelectorAll('#fichasTbody .icon-btn.edit').forEach(btn =>
    btn.addEventListener('click', (e) => {
      const idf = parseInt(btn.dataset.idf);
      const ficha = fichasTituladas.find(f => f.id_ficha === idf);
      if (ficha) abrirModalFicha(ficha);
    })
  );
}

function abrirModalFicha(ficha = null) {
  const isEdit = !!ficha;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  const idValue = isEdit ? ficha.id_ficha : '';
  const iniValue = isEdit ? ficha.fec_ini : '';
  const finValue = isEdit ? ficha.fec_fin : '';

  modal.innerHTML = `<div class="modal-card"><h3>${isEdit ? 'Editar Ficha' : 'Nueva Ficha'}</h3>
    <div class="form-group"><label>ID Ficha</label><input id="fichaId" type="number" value="${idValue}" ${isEdit ? 'readonly' : ''}></div>
    <div class="form-group"><label>Programa</label>
      <select id="fichaPrograma">
        ${programas.map(p => `<option value="${p.id_programa_titul}" ${isEdit && ficha.id_programa_titul === p.id_programa_titul ? 'selected' : ''}>${escapeHTML(p.nom_programa_titul)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Jornada</label>
      <select id="fichaJornada">
        <option ${isEdit && ficha.ind_jornada == 'M' ? 'selected' : ''} value="M">Mañana</option>
        <option ${isEdit && ficha.ind_jornada == 'T' ? 'selected' : ''} value="T">Tarde</option>
        <option ${isEdit && ficha.ind_jornada == 'N' ? 'selected' : ''} value="N">Noche</option>
      </select>
    </div>
    <div class="form-group"><label>Instructor Líder</label>
      <select id="fichaLider">
        ${instructores.map(i => `<option value="${i.id_instruc}" ${isEdit && ficha.id_instruc_lider === i.id_instruc ? 'selected' : ''}>${escapeHTML(i.nom_instruc)} ${escapeHTML(i.apelli_instruc)}</option>`).join('')}
        <option value="" ${isEdit && ficha.id_instruc_lider === null ? 'selected' : ''}>Sin líder</option>
      </select>
    </div>
    <div class="form-group"><label>Ambiente</label>
      <select id="fichaAmbiente">
        ${ambientes.map(a => `<option value="${a.id_ambiente}" ${isEdit && ficha.id_ambiente === a.id_ambiente ? 'selected' : ''}>${escapeHTML(a.nom_ambiente)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Fecha Inicio</label><input type="date" id="fichaIni" value="${iniValue}"></div>
    <div class="form-group"><label>Fecha Fin</label><input type="date" id="fichaFin" value="${finValue}"></div>
    <div class="flex-buttons"><button class="btn-secondary" id="cancelFicha">Cancelar</button><button class="btn-primary" id="saveFicha">Guardar</button></div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#cancelFicha').onclick = () => modal.remove();

  modal.querySelector('#saveFicha').onclick = () => {
    const id = parseInt(modal.querySelector('#fichaId').value);
    const prog = parseInt(modal.querySelector('#fichaPrograma').value);
    const jornada = modal.querySelector('#fichaJornada').value;
    const lider = modal.querySelector('#fichaLider').value ? parseInt(modal.querySelector('#fichaLider').value) : null;
    const amb = parseInt(modal.querySelector('#fichaAmbiente').value);
    const fecIni = modal.querySelector('#fichaIni').value;
    const fecFin = modal.querySelector('#fichaFin').value;

    if (!id || !fecIni || !fecFin || id <= 0) {
      alert("Complete datos obligatorios (ID positivo, fechas).");
      return;
    }
    if (new Date(fecIni) > new Date(fecFin)) {
      alert("La fecha de inicio debe ser anterior a la fecha de fin.");
      return;
    }
    if (!isEdit && fichasTituladas.some(f => f.id_ficha === id)) {
      alert("ID ficha ya existe.");
      return;
    }

    // Al editar se conservan los campos que el formulario no muestra (modalidad, etapa productiva)
    const base = isEdit ? ficha : { ind_modalidad: "P", fec_ini_etapa_produc: fecIni, ind_etapa_produc: false };
    const obj = {
      ...base,
      id_ficha: id,
      id_programa_titul: prog,
      ind_jornada: jornada,
      id_instruc_lider: lider,
      id_ambiente: amb,
      fec_ini: fecIni,
      fec_fin: fecFin
    };
    if (isEdit) {
      const idx = fichasTituladas.findIndex(f => f.id_ficha === id);
      if (idx !== -1) fichasTituladas[idx] = obj;
    } else {
      fichasTituladas.push(obj);
    }
    guardarDatos();
    renderFichas();
    modal.remove();
  };
}

// -------------------- TABS Y NAVEGACIÓN --------------------
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.getElementById('btnAddInstructor').onclick = () => abrirModalInstructor(null);
  document.getElementById('btnAddCompetencia').onclick = () => abrirModalCompetencia(null);
  document.getElementById('btnAddFicha').onclick = () => abrirModalFicha(null);
}

// -------------------- INICIALIZACIÓN --------------------
cargarDatosIniciales();
renderAll();
initTabs();
actualizarSelectsAsignacion();