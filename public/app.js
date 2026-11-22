const state = {
    token: null,
    email: null,
    authMode: "login",
    editing: null,
    appointments: [],
    lastBody: "",
};

const $ = (id) => document.getElementById(id);

const STATUS_LABELS = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    cancelled: "Cancelado",
};

function parseBody(text) {
    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function request(method, url, { body, auth = true, inspect = true } = {}) {
    const headers = {};

    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (auth && state.token) {
        headers.Authorization = `Bearer ${state.token}`;
    }

    if (inspect) {
        showPending(method, url);
    }

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        const data = parseBody(await response.text());

        if (inspect) {
            showResponse(response.status, response.statusText, data);
        }

        if (response.status === 401 && auth && state.token) {
            clearSession();
            setMessage("auth-message", "El token no es válido o expiró. Iniciá sesión nuevamente.", true);
        }

        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        if (inspect) {
            showNetworkError(error);
        }

        setServerStatus(false);
        return { ok: false, status: 0, data: null };
    }
}

function errorMessage(result) {
    if (result.status === 0) {
        return "No se pudo conectar con el servidor.";
    }

    if (result.data && typeof result.data === "object" && result.data.message) {
        return `${result.status}: ${result.data.message}`;
    }

    return `Error ${result.status}`;
}

function hideSensitive(data) {
    return JSON.stringify(
        data,
        (key, value) =>
            key === "token" && typeof value === "string"
                ? `${value.slice(0, 10)}…(oculto)`
                : value,
        2
    );
}

function showPending(method, url) {
    $("inspector-method").textContent = method;
    $("inspector-url").textContent = url;

    const status = $("inspector-status");
    status.textContent = "En curso…";
    status.className = "status-code pending";

    $("inspector-body").textContent = "";
    $("copy-button").disabled = true;
}

function showResponse(code, statusText, data) {
    const status = $("inspector-status");
    status.textContent = `${code} ${statusText}`.trim();
    status.className = code >= 400 ? "status-code error" : "status-code";

    const body = typeof data === "string" ? data : hideSensitive(data);
    state.lastBody = body;
    $("inspector-body").textContent = body || "(respuesta vacía)";
    $("copy-button").disabled = !body;
}

function showNetworkError(error) {
    const status = $("inspector-status");
    status.textContent = "Error de red";
    status.className = "status-code error";

    state.lastBody = "";
    $("inspector-body").textContent = `No se pudo conectar con el servidor.\n${error.message}`;
    $("copy-button").disabled = true;
}

async function copyResponse() {
    const button = $("copy-button");

    try {
        await navigator.clipboard.writeText(state.lastBody);
        button.textContent = "Copiado";
    } catch {
        button.textContent = "No se pudo copiar";
    }

    setTimeout(() => {
        button.textContent = "Copiar JSON";
    }, 1500);
}

function setMessage(id, text, isError = false) {
    const element = $(id);
    element.textContent = text;
    element.classList.toggle("error", isError);
}

function setServerStatus(online) {
    $("server-status").classList.toggle("online", online);
    $("server-status-text").textContent = online
        ? "Servidor en línea · GET /health"
        : "Servidor sin conexión";
}

async function checkHealth() {
    const result = await request("GET", "/health", { auth: false, inspect: false });
    setServerStatus(result.ok);
}

function setAuthMode(mode) {
    state.authMode = mode;

    $("tab-login").setAttribute("aria-pressed", String(mode === "login"));
    $("tab-register").setAttribute("aria-pressed", String(mode === "register"));
    $("auth-submit").textContent = mode === "login" ? "Iniciar sesión" : "Registrarse";
    $("auth-password").autocomplete = mode === "login" ? "current-password" : "new-password";
    setMessage("auth-message", "");
}

function tokenExpiry(token) {
    try {
        const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const { exp } = JSON.parse(atob(payload));

        return typeof exp === "number" ? new Date(exp * 1000) : null;
    } catch {
        return null;
    }
}

function renderSession() {
    const loggedIn = Boolean(state.token);

    $("auth-session").hidden = !loggedIn;
    $("auth-forms").hidden = loggedIn;
    $("form-auth-hint").hidden = loggedIn;
    $("test-400").disabled = !loggedIn;

    if (loggedIn) {
        $("session-email").textContent = state.email;

        const expiry = tokenExpiry(state.token);
        $("session-expiry").textContent = expiry
            ? `El token vence aprox. a las ${expiry.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
            : "";
    }
}

function clearSession() {
    state.token = null;
    state.email = null;
    renderSession();
}

async function submitAuth(event) {
    event.preventDefault();

    const email = $("auth-email").value;
    const password = $("auth-password").value;
    const submit = $("auth-submit");

    submit.disabled = true;
    setMessage("auth-message", "Enviando…");

    const url = state.authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const result = await request("POST", url, { body: { email, password }, auth: false });

    submit.disabled = false;
    $("auth-password").value = "";

    if (!result.ok) {
        setMessage("auth-message", errorMessage(result), true);
        return;
    }

    if (state.authMode === "register") {
        setAuthMode("login");
        setMessage("auth-message", "Usuario registrado. Ahora iniciá sesión.");
        return;
    }

    state.token = result.data.token;
    state.email = result.data.user.email;
    setMessage("auth-message", "");
    renderSession();
}

function logout() {
    clearSession();
    setMessage("auth-message", "Sesión cerrada.");
}

function formatDate(iso) {
    return new Date(iso).toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

function toDateTimeLocal(iso) {
    const date = new Date(iso);
    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(value) {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function cell(text) {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
}

function actionButton(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button secondary small";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
}

function renderAppointments() {
    const tbody = $("appointments-body");
    tbody.replaceChildren();

    for (const appointment of state.appointments) {
        const row = document.createElement("tr");
        const actions = document.createElement("td");
        const buttons = document.createElement("div");
        buttons.className = "row-actions";

        buttons.append(
            actionButton("Editar", () => startEditing(appointment)),
            actionButton("Eliminar", () => removeAppointment(appointment))
        );
        actions.append(buttons);

        row.append(
            cell(appointment.id),
            cell(appointment.patientName),
            cell(appointment.specialty),
            cell(formatDate(appointment.scheduledAt)),
            cell(STATUS_LABELS[appointment.status] ?? appointment.status),
            actions
        );

        tbody.append(row);
    }

    $("list-message").textContent = state.appointments.length
        ? ""
        : "No hay turnos cargados. Creá uno con el formulario.";
}

async function loadAppointments({ inspect = true } = {}) {
    $("list-message").textContent = "Cargando…";

    const result = await request("GET", "/api/appointments", { inspect });

    if (!result.ok || !Array.isArray(result.data)) {
        $("list-message").textContent = `No se pudo cargar la lista. ${errorMessage(result)}`;
        return;
    }

    state.appointments = result.data;
    renderAppointments();
}

function readForm() {
    return {
        patientName: $("patient-name").value,
        specialty: $("specialty").value,
        scheduledAt: toIso($("scheduled-at").value),
        status: $("status").value,
    };
}

function startEditing(appointment) {
    state.editing = appointment;

    $("patient-name").value = appointment.patientName;
    $("specialty").value = appointment.specialty;
    $("scheduled-at").value = toDateTimeLocal(appointment.scheduledAt);
    $("status").value = appointment.status;

    $("form-title").textContent = `Editar turno #${appointment.id}`;
    $("form-submit").textContent = "Guardar cambios";
    $("form-cancel").hidden = false;
    setMessage("form-message", "Solo se envían los campos modificados.");
    checkDate();
    $("patient-name").focus();
}

function stopEditing() {
    state.editing = null;
    $("appointment-form").reset();

    $("form-title").textContent = "Crear turno";
    $("form-submit").textContent = "Crear turno";
    $("form-cancel").hidden = true;
    checkDate();
}

function changedFields(original, values) {
    const changes = {};

    if (values.patientName !== original.patientName) changes.patientName = values.patientName;
    if (values.specialty !== original.specialty) changes.specialty = values.specialty;
    if (values.status !== original.status) changes.status = values.status;
    if (new Date(values.scheduledAt).getTime() !== new Date(original.scheduledAt).getTime()) {
        changes.scheduledAt = values.scheduledAt;
    }

    return changes;
}

async function submitAppointment(event) {
    event.preventDefault();

    const values = readForm();
    const editing = state.editing;
    const submit = $("form-submit");

    submit.disabled = true;
    setMessage("form-message", "Enviando…");

    const result = editing
        ? await request("PUT", `/api/appointments/${editing.id}`, {
            body: changedFields(editing, values),
        })
        : await request("POST", "/api/appointments", { body: values });

    submit.disabled = false;

    if (!result.ok) {
        setMessage("form-message", errorMessage(result), true);
        return;
    }

    stopEditing();
    setMessage(
        "form-message",
        editing ? `Turno #${result.data.id} modificado.` : `Turno #${result.data.id} creado.`
    );
    await loadAppointments({ inspect: false });
}

async function removeAppointment(appointment) {
    if (!confirm(`¿Eliminar el turno #${appointment.id} de ${appointment.patientName}?`)) {
        return;
    }

    const result = await request("DELETE", `/api/appointments/${appointment.id}`);

    if (!result.ok) {
        $("list-message").textContent = `No se pudo eliminar. ${errorMessage(result)}`;
        return;
    }

    if (state.editing?.id === appointment.id) {
        stopEditing();
    }

    await loadAppointments({ inspect: false });
}

async function lookupAppointment(event) {
    event.preventDefault();
    await request("GET", `/api/appointments/${$("lookup-id").value}`);
}

function checkDate() {
    const value = $("scheduled-at").value;
    const isPast = Boolean(value) && new Date(value).getTime() <= Date.now();

    $("date-warning").hidden = !isPast;
}

function futureDate() {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

function testBadRequest() {
    return request("POST", "/api/appointments", {
        body: { patientName: "Paciente Demo", specialty: "", scheduledAt: futureDate() },
    });
}

function testUnauthorized() {
    return request("POST", "/api/appointments", {
        body: { patientName: "Paciente Demo", specialty: "Clínica médica", scheduledAt: futureDate() },
        auth: false,
    });
}

function testNotFound() {
    return request("GET", "/api/appointments/999999");
}

$("tab-login").addEventListener("click", () => setAuthMode("login"));
$("tab-register").addEventListener("click", () => setAuthMode("register"));
$("auth-form").addEventListener("submit", submitAuth);
$("logout-button").addEventListener("click", logout);
$("appointment-form").addEventListener("submit", submitAppointment);
$("form-cancel").addEventListener("click", () => {
    stopEditing();
    setMessage("form-message", "");
});
$("scheduled-at").addEventListener("input", checkDate);
$("lookup-form").addEventListener("submit", lookupAppointment);
$("refresh-button").addEventListener("click", () => loadAppointments());
$("copy-button").addEventListener("click", copyResponse);
$("test-400").addEventListener("click", testBadRequest);
$("test-401").addEventListener("click", testUnauthorized);
$("test-404").addEventListener("click", testNotFound);

renderSession();
checkHealth();
loadAppointments({ inspect: false });
