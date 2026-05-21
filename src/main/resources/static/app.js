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
    elements.summaryApiState = document.getElementById("summary-api-state");
    elements.monitorCountLabel = document.getElementById("monitor-count-label");
    elements.monitorList = document.getElementById("monitor-list");
    elements.monitorTemplate = document.getElementById("monitor-template");
    elements.cronPresets = document.getElementById("cron-presets");
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

    // Bind click events on quick-select cron presets
    if (elements.cronPresets) {
        elements.cronPresets.addEventListener("click", (event) => {
            const button = event.target.closest(".cron-preset-pill");
            if (button) {
                const cronExpr = button.dataset.cron;
                if (cronExpr) {
                    elements.cronExpression.value = cronExpr;
                    showToast(`Applied preset: ${button.textContent}`, "success");
                    elements.cronExpression.focus();
                }
            }
        });
    }
}

async function loadDashboard(showSuccessMessage = false) {
    state.loading = true;
    state.loadingAction = "refresh";
    setBusyState();
    renderSkeletons();

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
            showToast("Dashboard synchronized.", "success");
        }
    } catch (error) {
        renderHealth(error);
        renderSummary();
        renderMonitors(error);
        showToast(error.message || "Failed to retrieve monitors status.", "error");
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
    renderSkeletons();

    try {
        const monitors = await request("/api/monitors");
        state.monitors = (Array.isArray(monitors) ? monitors : []).sort(sortMonitors);
        renderSummary();
        renderMonitors();
        showToast("Synchronous ping dispatched to all endpoints.", "success");
    } catch (error) {
        renderMonitors(error);
        showToast(error.message || "Ping invocation failed.", "error");
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
        showToast(error.message, "error");
        return;
    }

    const isEditing = state.editingId !== null;
    const path = isEditing ? `/api/monitors/${state.editingId}` : "/api/monitors";
    const method = isEditing ? "PUT" : "POST";

    elements.submitButton.disabled = true;
    elements.submitButton.querySelector("span").textContent = isEditing ? "Updating..." : "Saving...";

    try {
        await request(path, {
            method,
            body: JSON.stringify(payload)
        });

        resetForm();
        await loadDashboard();
        showToast(isEditing ? "Monitor configurations updated." : "New monitor initialized successfully.", "success");
    } catch (error) {
        showToast(error.message || "Failed to commit monitor config.", "error");
    } finally {
        elements.submitButton.disabled = false;
        elements.submitButton.querySelector("span").textContent = "Save monitor";
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
        throw new Error(`${label} contains syntax issues (must be valid JSON).`);
    }
}

function renderHealth(error) {
    elements.healthDot.className = "status-dot";

    if (error || !state.health) {
        elements.healthDot.classList.add("issue");
        elements.healthState.textContent = "Health unavailable";
        elements.summaryApiState.textContent = "Offline";
        elements.summaryApiState.style.color = "var(--danger)";
        return;
    }

    if (state.health.status === "200") {
        elements.healthDot.classList.add("ok");
        elements.healthState.textContent = "API healthy";
        elements.summaryApiState.textContent = "Online";
        elements.summaryApiState.style.color = "var(--success)";
        return;
    }

    elements.healthDot.classList.add("issue");
    elements.healthState.textContent = "API needs attention";
    elements.summaryApiState.textContent = "Warning";
    elements.summaryApiState.style.color = "var(--warning)";
}

function renderSummary() {
    const total = state.monitors.length;
    const totalSuccess = state.monitors.reduce((sum, monitor) => sum + (monitor.successCount || 0), 0);
    const totalFailure = state.monitors.reduce((sum, monitor) => sum + (monitor.failureCount || 0), 0);

    elements.summaryTotal.textContent = total;
    elements.summarySuccess.textContent = totalSuccess;
    elements.summaryFailure.textContent = totalFailure;
    elements.monitorCountLabel.textContent = `${total} ${total === 1 ? "monitor" : "monitors"}`;
}

function renderMonitors(error) {
    elements.monitorList.replaceChildren();

    if (error) {
        elements.monitorList.appendChild(createEmptyState("Unable to fetch registered monitors."));
        return;
    }

    if (!state.monitors.length) {
        elements.monitorList.appendChild(createEmptyState("No monitors active. Configure one on the left."));
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
        
        // Method badge compilation
        const methodBadge = fragment.querySelector(".method-badge");
        const methodStr = (monitor.method || "GET").toUpperCase();
        methodBadge.textContent = methodStr;
        methodBadge.className = `method-badge ${methodStr.toLowerCase()}`;

        fragment.querySelector(".cron-val").textContent = monitor.cronExpression || "No cron";
        fragment.querySelector(".update-val").textContent = `${formatDate(monitor.updatedAt || monitor.createdAt)}`;
        
        const statusBadge = fragment.querySelector(".status-badge");
        statusBadge.textContent = status.label;
        statusBadge.className = `status-badge ${status.className}`;

        fragment.querySelector(".success-val").textContent = `Success ${monitor.successCount || 0}`;
        fragment.querySelector(".failure-val").textContent = `Failure ${monitor.failureCount || 0}`;
        fragment.querySelector(".validation-val").textContent = expectedJson !== null ? "Validation on" : "Validation off";

        // Handle JSON Preview panel trigger
        previewButton.disabled = !hasJson;
        previewButton.addEventListener("click", () => {
            const content = {};
            if (bodyJson !== null) content.requestBody = bodyJson;
            if (expectedJson !== null) content.expectedStructure = expectedJson;

            preview.textContent = JSON.stringify(content, null, 2);
            preview.classList.toggle("hidden");
            
            const isHidden = preview.classList.contains("hidden");
            previewButton.querySelector("span").textContent = isHidden ? "JSON" : "Hide";
        });

        // Form mappings
        fragment.querySelector(".edit-button").addEventListener("click", () => populateForm(monitor));
        fragment.querySelector(".delete-button").addEventListener("click", async () => {
            const confirmed = window.confirm(`Confirm deletion of monitor endpoint for: ${monitor.url}?`);
            if (!confirmed) {
                return;
            }

            try {
                await request(`/api/monitors/${monitor.id}`, { method: "DELETE" });
                if (state.editingId === monitor.id) {
                    resetForm();
                }
                await loadDashboard();
                showToast("Monitor configuration deleted.", "success");
            } catch (deleteError) {
                showToast(deleteError.message || "Failed to purge monitor.", "error");
            }
        });

        elements.monitorList.appendChild(fragment);
    });
}

function populateForm(monitor) {
    state.editingId = monitor.id;
    elements.formTitle.textContent = "Edit monitor";
    elements.cancelEdit.hidden = false;
    elements.submitButton.querySelector("span").textContent = "Save monitor";
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
    elements.submitButton.querySelector("span").textContent = "Save monitor";
}

function setBusyState() {
    elements.refreshButton.disabled = state.loading;
    elements.pingAllButton.disabled = state.loading;

    const refreshText = elements.refreshButton.querySelector("span");
    const pingText = elements.pingAllButton.querySelector("span");

    if (state.loadingAction === "refresh") {
        if (refreshText) refreshText.textContent = "Synchronizing...";
        if (pingText) pingText.textContent = "Ping all";
        return;
    }

    if (state.loadingAction === "ping") {
        if (refreshText) refreshText.textContent = "Refresh";
        if (pingText) pingText.textContent = "Pinging...";
        return;
    }

    if (refreshText) refreshText.textContent = "Refresh";
    if (pingText) pingText.textContent = "Ping all";
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
        return { label: "New Connection", className: "neutral" };
    }

    if (!success) {
        return { label: "Failing", className: "danger" };
    }

    if (failure === 0) {
        return { label: "Operational", className: "success" };
    }

    return { label: "De-stabilized", className: "warning" };
}

function sortMonitors(left, right) {
    const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
    const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
    return rightTime - leftTime;
}

function renderSkeletons() {
    elements.monitorList.replaceChildren();
    
    // Draw three elegant shimmering cards
    for (let i = 0; i < 3; i++) {
        const wrapper = document.createElement("div");
        wrapper.className = "monitor-item skeleton-card";
        wrapper.innerHTML = `
            <div class="monitor-main">
                <div class="monitor-info" style="width: 70%;">
                    <div class="skeleton-text heading"></div>
                    <div class="monitor-meta">
                        <span class="skeleton-text pill"></span>
                        <span class="skeleton-text pill" style="width: 100px;"></span>
                    </div>
                </div>
                <span class="skeleton-text pill" style="width: 75px; height: 26px;"></span>
            </div>
            <div class="monitor-stats" style="margin-top: 14px; border-top: 1px solid var(--border); padding-top: 14px;">
                <span class="skeleton-text pill" style="width: 80px;"></span>
                <span class="skeleton-text pill" style="width: 80px;"></span>
                <span class="skeleton-text pill" style="width: 90px;"></span>
            </div>
        `;
        elements.monitorList.appendChild(wrapper);
    }
}

function createEmptyState(text) {
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";

    // Use our embedded server icon in empty state
    wrapper.innerHTML = `
        <svg><use href="#icon-servers"></use></svg>
        <p>${escapeHtml(text)}</p>
    `;
    return wrapper;
}

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const iconId = type === "success" ? "icon-toast-success" : "icon-toast-error";
    toast.innerHTML = `
        <svg><use href="#${iconId}"></use></svg>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Auto animate slideout and cleanup after 3.2s
    setTimeout(() => {
        toast.classList.add("fade-out");
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 3200);
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
        throw new Error(message || `API error (HTTP status: ${response.status}).`);
    }

    return data;
}
