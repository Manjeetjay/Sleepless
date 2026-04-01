const state = {
    monitors: [],
    health: null,
    editingId: null,
    loading: false,
    loadingAction: null
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
    cacheElements();
    bindEvents();
    renderSummary();
    renderMonitors();
    loadDashboard();
});

function cacheElements() {
    elements.form = document.getElementById("monitor-form");
    elements.formTitle = document.getElementById("form-title");
    elements.cancelEdit = document.getElementById("cancel-edit");
    elements.submitButton = document.getElementById("submit-button");
    elements.url = document.getElementById("url");
    elements.method = document.getElementById("method");
    elements.cronExpression = document.getElementById("cronExpression");
    elements.requestBody = document.getElementById("requestBody");
    elements.expectedStructure = document.getElementById("expectedStructure");
    elements.refreshButton = document.getElementById("refresh-dashboard");
    elements.pingAllButton = document.getElementById("ping-all");
    elements.healthDot = document.getElementById("health-dot");
    elements.healthState = document.getElementById("health-state");
    elements.summaryTotal = document.getElementById("summary-total");
    elements.summarySuccess = document.getElementById("summary-success");
    elements.summaryFailure = document.getElementById("summary-failure");
    elements.monitorCountLabel = document.getElementById("monitor-count-label");
    elements.messageBox = document.getElementById("message-box");
    elements.monitorList = document.getElementById("monitor-list");
    elements.monitorTemplate = document.getElementById("monitor-template");
}

function bindEvents() {
    elements.refreshButton.addEventListener("click", async () => {
        await loadDashboard(true);
    });

    elements.pingAllButton.addEventListener("click", async () => {
        await pingAllMonitors();
    });

    elements.form.addEventListener("submit", handleSubmit);
    elements.cancelEdit.addEventListener("click", resetForm);
}

async function loadDashboard(showSuccessMessage = false) {
    state.loading = true;
    state.loadingAction = "refresh";
    setBusyState();

    try {
        const [health, monitors] = await Promise.all([
            request("/api/health"),
            request("/api/monitors")
        ]);

        state.health = health;
        state.monitors = (Array.isArray(monitors) ? monitors : []).sort(sortMonitors);
        renderHealth();
        renderSummary();
        renderMonitors();

        if (showSuccessMessage) {
            showMessage("Refreshed.", "success");
        }
    } catch (error) {
        renderHealth(error);
        renderSummary();
        renderMonitors(error);
        showMessage(error.message || "Unable to load data.", "error");
    } finally {
        state.loading = false;
        state.loadingAction = null;
        setBusyState();
    }
}

async function pingAllMonitors() {
    state.loading = true;
    state.loadingAction = "ping";
    setBusyState();

    try {
        const monitors = await request("/api/monitors");
        state.monitors = (Array.isArray(monitors) ? monitors : []).sort(sortMonitors);
        renderSummary();
        renderMonitors();
        showMessage("Ping all requested.", "success");
    } catch (error) {
        renderMonitors(error);
        showMessage(error.message || "Unable to ping monitors.", "error");
    } finally {
        state.loading = false;
        state.loadingAction = null;
        setBusyState();
    }
}

async function handleSubmit(event) {
    event.preventDefault();

    let payload;
    try {
        payload = buildPayload();
    } catch (error) {
        showMessage(error.message, "error");
        return;
    }

    const isEditing = state.editingId !== null;
    const path = isEditing ? `/api/monitors/${state.editingId}` : "/api/monitors";
    const method = isEditing ? "PUT" : "POST";

    elements.submitButton.disabled = true;
    elements.submitButton.textContent = isEditing ? "Updating..." : "Saving...";

    try {
        await request(path, {
            method,
            body: JSON.stringify(payload)
        });

        resetForm();
        await loadDashboard();
        showMessage(isEditing ? "Monitor updated." : "Monitor created.", "success");
    } catch (error) {
        showMessage(error.message || "Unable to save monitor.", "error");
    } finally {
        elements.submitButton.disabled = false;
        elements.submitButton.textContent = "Save monitor";
    }
}

function buildPayload() {
    return {
        url: elements.url.value.trim(),
        method: elements.method.value,
        cronExpression: elements.cronExpression.value.trim(),
        requestBody: parseJsonTextarea(elements.requestBody.value, "Request body JSON"),
        expectedStructure: parseJsonTextarea(elements.expectedStructure.value, "Expected response JSON")
    };
}

function parseJsonTextarea(value, label) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    try {
        return JSON.parse(trimmed);
    } catch (error) {
        throw new Error(`${label} is not valid JSON.`);
    }
}

function renderHealth(error) {
    elements.healthDot.className = "status-dot";

    if (error || !state.health) {
        elements.healthDot.classList.add("issue");
        elements.healthState.textContent = "Health unavailable";
        return;
    }

    if (state.health.status === "200") {
        elements.healthDot.classList.add("ok");
        elements.healthState.textContent = "API healthy";
        return;
    }

    elements.healthDot.classList.add("issue");
    elements.healthState.textContent = "API needs attention";
}

function renderSummary() {
    const total = state.monitors.length;
    const totalSuccess = state.monitors.reduce((sum, monitor) => sum + (monitor.successCount || 0), 0);
    const totalFailure = state.monitors.reduce((sum, monitor) => sum + (monitor.failureCount || 0), 0);

    elements.summaryTotal.textContent = `${total} ${total === 1 ? "monitor" : "monitors"}`;
    elements.summarySuccess.textContent = `${totalSuccess} successful pings`;
    elements.summaryFailure.textContent = `${totalFailure} failures`;
    elements.monitorCountLabel.textContent = `${total} ${total === 1 ? "monitor" : "monitors"}`;
}

function renderMonitors(error) {
    elements.monitorList.replaceChildren();

    if (error) {
        elements.monitorList.appendChild(createEmptyState("Unable to load monitors."));
        return;
    }

    if (!state.monitors.length) {
        elements.monitorList.appendChild(createEmptyState("No monitors yet."));
        return;
    }

    state.monitors.forEach((monitor) => {
        const fragment = elements.monitorTemplate.content.cloneNode(true);
        const bodyJson = normalizeJsonField(monitor.requestBody);
        const expectedJson = normalizeJsonField(monitor.expectedStructure);
        const hasJson = bodyJson !== null || expectedJson !== null;
        const status = getStatusMeta(monitor);
        const preview = fragment.querySelector(".json-preview");
        const previewButton = fragment.querySelector(".preview-button");

        fragment.querySelector(".monitor-url").textContent = monitor.url || "Untitled monitor";
        fragment.querySelector(".method-badge").textContent = (monitor.method || "GET").toUpperCase();
        fragment.querySelector(".monitor-cron").textContent = monitor.cronExpression || "No cron";
        fragment.querySelector(".monitor-updated").textContent = `Updated ${formatDate(monitor.updatedAt || monitor.createdAt)}`;
        fragment.querySelector(".status-badge").textContent = status.label;
        fragment.querySelector(".status-badge").classList.add(status.className);
        fragment.querySelector(".monitor-success").textContent = `Success ${monitor.successCount || 0}`;
        fragment.querySelector(".monitor-failure").textContent = `Failure ${monitor.failureCount || 0}`;
        fragment.querySelector(".monitor-validation").textContent = expectedJson !== null ? "Validation on" : "Validation off";

        previewButton.disabled = !hasJson;
        previewButton.addEventListener("click", () => {
            const content = {
                requestBody: bodyJson,
                expectedStructure: expectedJson
            };

            preview.textContent = JSON.stringify(content, null, 2);
            preview.classList.toggle("hidden");
            previewButton.textContent = preview.classList.contains("hidden") ? "JSON" : "Hide JSON";
        });

        fragment.querySelector(".edit-button").addEventListener("click", () => populateForm(monitor));
        fragment.querySelector(".delete-button").addEventListener("click", async () => {
            const confirmed = window.confirm(`Delete the monitor for ${monitor.url}?`);
            if (!confirmed) {
                return;
            }

            try {
                await request(`/api/monitors/${monitor.id}`, { method: "DELETE" });
                if (state.editingId === monitor.id) {
                    resetForm();
                }
                await loadDashboard();
                showMessage("Monitor deleted.", "success");
            } catch (deleteError) {
                showMessage(deleteError.message || "Unable to delete monitor.", "error");
            }
        });

        elements.monitorList.appendChild(fragment);
    });
}

function populateForm(monitor) {
    state.editingId = monitor.id;
    elements.formTitle.textContent = "Edit monitor";
    elements.cancelEdit.hidden = false;
    elements.submitButton.textContent = "Save monitor";
    elements.url.value = monitor.url || "";
    elements.method.value = (monitor.method || "GET").toUpperCase();
    elements.cronExpression.value = monitor.cronExpression || "";
    elements.requestBody.value = formatJson(normalizeJsonField(monitor.requestBody));
    elements.expectedStructure.value = formatJson(normalizeJsonField(monitor.expectedStructure));
    elements.url.focus();
}

function resetForm() {
    state.editingId = null;
    elements.form.reset();
    elements.formTitle.textContent = "Create monitor";
    elements.cancelEdit.hidden = true;
    elements.submitButton.textContent = "Save monitor";
}

function setBusyState() {
    elements.refreshButton.disabled = state.loading;
    elements.pingAllButton.disabled = state.loading;

    if (state.loadingAction === "refresh") {
        elements.refreshButton.textContent = "Refreshing...";
        elements.pingAllButton.textContent = "Ping all";
        return;
    }

    if (state.loadingAction === "ping") {
        elements.refreshButton.textContent = "Refresh";
        elements.pingAllButton.textContent = "Pinging...";
        return;
    }

    elements.refreshButton.textContent = "Refresh";
    elements.pingAllButton.textContent = "Ping all";
}

function normalizeJsonField(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch (error) {
            return value;
        }
    }

    return value;
}

function formatJson(value) {
    return value === null ? "" : JSON.stringify(value, null, 2);
}

function formatDate(value) {
    if (!value) {
        return "recently";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "recently";
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function getStatusMeta(monitor) {
    const success = monitor.successCount || 0;
    const failure = monitor.failureCount || 0;
    const total = success + failure;

    if (!total) {
        return { label: "New", className: "neutral" };
    }

    if (!success) {
        return { label: "Failing", className: "danger" };
    }

    if (failure === 0) {
        return { label: "Healthy", className: "success" };
    }

    return { label: "Warning", className: "warning" };
}

function sortMonitors(left, right) {
    const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
    const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
    return rightTime - leftTime;
}

function createEmptyState(text) {
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";

    const paragraph = document.createElement("p");
    paragraph.textContent = text;

    wrapper.appendChild(paragraph);
    return wrapper;
}

function showMessage(text, type) {
    elements.messageBox.textContent = text;
    elements.messageBox.className = `message ${type}`;
    elements.messageBox.classList.remove("hidden");

    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => {
        elements.messageBox.classList.add("hidden");
    }, 3000);
}

async function request(path, options = {}) {
    const headers = {};
    if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(path, {
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {})
        }
    });

    const raw = await response.text();
    let data = null;

    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch (error) {
            data = raw;
        }
    }

    if (!response.ok) {
        const message = data && typeof data === "object" ? data.error || data.message : null;
        throw new Error(message || `Request failed with status ${response.status}.`);
    }

    return data;
}
