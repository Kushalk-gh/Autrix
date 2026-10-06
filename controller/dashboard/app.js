(() => {
  "use strict";

  const main = document.querySelector("#main-content");
  const breadcrumb = document.querySelector("#page-breadcrumb");
  const wizardSteps = ["Basic info", "Container", "Scaling", "Health check", "Review"];
  const wizardData = {
    name: "",
    version: "v1",
    appType: "http",
    image: "",
    port: "8080",
    cpu: "100m",
    memory: "128Mi",
    environment: "",
    scalingMode: "auto",
    minReplicas: "1",
    maxReplicas: "5",
    targetRPSPerReplica: "50",
    maxP95LatencyMs: "250",
    scaleOutThresholdPct: "80",
    scaleInThresholdPct: "30",
    windowSeconds: "60",
    cooldownSeconds: "300",
    healthPath: "/health",
    healthPort: "8080"
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const pretty = (value) => escapeHtml(JSON.stringify(value ?? {}, null, 2));
  const titleCase = (text) => String(text || "").replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const routeParts = () => location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map((part) => {
    try { return decodeURIComponent(part); } catch { return part; }
  });
  const appUrl = (name, suffix = "") => `/apps/${encodeURIComponent(name)}${suffix}`;
  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(path, { ...options, headers, cache: "no-store" });
    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!response.ok) {
      const detail = data && typeof data === "object" ? data.detail || data.error || data.message : data;
      const message = Array.isArray(detail)
        ? detail.map((item) => `${(item.loc || []).slice(-1)[0] || "Request"}: ${item.msg || "Invalid value"}`).join("; ")
        : detail || response.statusText || "The request could not be completed.";
      const error = new Error(String(message));
      error.status = response.status;
      error.headers = response.headers;
      throw error;
    }
    return data;
  }

  function toast(message, kind = "") {
    const region = document.querySelector("#toast-region");
    const item = document.createElement("div");
    item.className = `toast ${kind}`.trim();
    item.textContent = message;
    region.append(item);
    window.setTimeout(() => item.remove(), 4500);
  }

  function panelError(error, retry = "") {
    return `<div class="error-panel"><p><strong>We couldn't load this information.</strong> ${escapeHtml(error.message || error)}</p>${retry ? `<button class="button button-small button-outline" data-action="${escapeHtml(retry)}">Try again</button>` : ""}</div>`;
  }

  function loading(text = "Loading information…") {
    return `<div class="loading-state" role="status">${escapeHtml(text)}</div>`;
  }

  function badge(value) {
    const status = String(value || "unknown").toLowerCase();
    const cls = /running|healthy|ready|connected|leader/.test(status) ? "running"
      : /stopped|unhealthy|error|failed/.test(status) ? "stopped"
        : /scal|degrad|warning|pending/.test(status) ? "scaling" : "";
    return `<span class="badge ${cls ? `badge-${cls}` : ""}">${escapeHtml(titleCase(status))}</span>`;
  }

  function jsonBlock(value, className = "code-panel") {
    return `<pre class="${className}">${pretty(value)}</pre>`;
  }

  function appEntries(data) {
    return Array.isArray(data?.apps) ? data.apps : [];
  }

  function appName(record) {
    return record?.name || record?.app || record?.metadata?.name || "Unnamed application";
  }

  function appImage(record) {
    return record?.spec?.spec?.image || record?.spec?.image || record?.image || "—";
  }

  function navigation(route) {
    const top = route[0] || "dashboard";
    const target = top === "app" ? "apps" : top;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      link.classList.toggle("active", link.dataset.nav === target || (target === "apps" && link.dataset.nav === "apps"));
      if (link.classList.contains("active")) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    const labels = {
      dashboard: "Dashboard", apps: "Applications", app: "Application details",
      create: "Create application", cluster: "Cluster", metrics: "Metrics",
      events: "Events", advanced: "Advanced tools"
    };
    breadcrumb.textContent = labels[top] || "Dashboard";
    if (top === "app" && route[1]) breadcrumb.textContent = route[1];
  }

  function pageHeading(title, subtitle, action = "") {
    return `<div class="page-heading"><div><p class="eyebrow">Autrix control center</p><h1>${escapeHtml(title)}</h1><p class="subtitle">${escapeHtml(subtitle)}</p></div>${action}</div>`;
  }

  function statCard(label, value, hint, icon) {
    return `<article class="card stat-card"><span class="stat-icon" aria-hidden="true">${icon}</span><div class="stat-label">${escapeHtml(label)}</div><div class="stat-value">${escapeHtml(value)}</div><div class="stat-hint">${escapeHtml(hint)}</div></article>`;
  }

  function listTable(apps) {
    if (!apps.length) {
      return `<div class="empty-state"><strong>No applications yet</strong>Register an app to see its status, scaling, logs, and metrics here.<p style="margin:14px 0 0"><a class="button button-primary" href="#/create">Create an application</a></p></div>`;
    }
    const rows = apps.map((record) => {
      const name = appName(record);
      const replicas = record.replicas ?? "—";
      const ready = record.ready_replicas ?? "—";
      return `<tr>
        <td><a class="app-name" href="#/app/${encodeURIComponent(name)}/status">${escapeHtml(name)}</a><div class="muted">${escapeHtml(appImage(record))}</div></td>
        <td>${badge(record.status)}</td>
        <td>${escapeHtml(ready)} / ${escapeHtml(replicas)}</td>
        <td><div class="row-actions">
          <button class="button button-small button-success" data-action="start" data-app="${escapeHtml(name)}">Start</button>
          <button class="button button-small button-quiet" data-action="stop" data-app="${escapeHtml(name)}">Stop</button>
          <a class="button button-small button-outline" href="#/app/${encodeURIComponent(name)}/status">Details</a>
        </div></td>
      </tr>`;
    }).join("");
    return `<div class="table-wrap"><table><thead><tr><th>Application</th><th>Status</th><th>Ready / desired</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  async function renderDashboard() {
    main.innerHTML = pageHeading("Welcome to Autrix", "See how your applications and controller cluster are doing.") +
      `<div class="grid grid-4" id="dashboard-stats">${loading("Checking your applications…")}</div>
      <div id="dashboard-health" style="margin-top:16px">${loading("Checking cluster health…")}</div>
      <div class="overview-grid">
        <section class="card card-pad"><div class="section-head"><div><h2>Your applications</h2><p class="section-subtitle">Quick view of registered applications and actions.</p></div><a class="button button-primary button-small" href="#/create">+ Create application</a></div><div id="dashboard-apps">${loading()}</div></section>
        <section class="card card-pad"><div class="section-head"><div><h2>Cluster overview</h2><p class="section-subtitle">Controller and service health.</p></div><a class="button button-outline button-small" href="#/cluster">View details</a></div><div id="dashboard-cluster">${loading()}</div></section>
      </div>`;

    const [appsResult, metricsResult, healthResult, clusterResult, leaderResult] = await Promise.allSettled([
      api("/apps"), api("/metrics"), api("/cluster/health"), api("/cluster/status"), api("/cluster/leader")
    ]);
    if (!main.isConnected) return;
    const apps = appsResult.status === "fulfilled" ? appEntries(appsResult.value) : [];
    const metrics = metricsResult.status === "fulfilled" ? metricsResult.value : null;
    const health = healthResult.status === "fulfilled" ? healthResult.value : null;
    document.querySelector("#dashboard-stats").innerHTML = appsResult.status === "rejected"
      ? panelError(appsResult.reason, "reload")
      : [
          statCard("Total applications", apps.length, "Registered with Orchestry", "▦"),
          statCard("Running", metrics?.apps?.running ?? apps.filter((app) => String(app.status).toLowerCase() === "running").length, "Currently active applications", "▶"),
          statCard("Stopped", Math.max(0, apps.length - number(metrics?.apps?.running, apps.filter((app) => String(app.status).toLowerCase() === "running").length)), "Not currently running", "■"),
          statCard("Instances", metrics?.instances?.total ?? "—", "Across the cluster", "◉")
        ].join("");
    document.querySelector("#dashboard-apps").innerHTML = appsResult.status === "rejected" ? panelError(appsResult.reason, "reload") : listTable(apps.slice(0, 5));
    const healthBox = document.querySelector("#dashboard-health");
    if (healthResult.status === "rejected") healthBox.innerHTML = panelError(healthResult.reason, "reload");
    else {
      const state = String(health?.status || "unknown").toLowerCase();
      const kind = state === "healthy" ? "" : state === "degraded" ? "warning" : "error";
      healthBox.innerHTML = `<div class="health-banner ${kind}"><span class="health-icon" aria-hidden="true">${state === "healthy" ? "✓" : "!"}</span><div><div class="health-title">Cluster ${escapeHtml(titleCase(state))}</div><p class="health-copy">${health.clustering === "disabled" ? "The controller is running without clustering enabled." : escapeHtml(health.error || (health.cluster_ready === false ? "The cluster is responding but not all controllers are ready." : "Controller health check completed."))}</p></div><a class="button button-small button-outline" href="#/cluster" style="margin-left:auto">Cluster details</a></div>`;
    }
    const clusterEl = document.querySelector("#dashboard-cluster");
    const leader = leaderResult.status === "fulfilled" ? leaderResult.value : null;
    const cluster = clusterResult.status === "fulfilled" ? clusterResult.value : null;
    if (!cluster && !leader) clusterEl.innerHTML = panelError(clusterResult.reason || leaderResult.reason);
    else clusterEl.innerHTML = `<div class="info-list">
      <div class="info-row"><span class="info-label">Leader</span><span class="info-value">${escapeHtml(leader?.leader_id || leader?.node_id || cluster?.leader_id || "Not reported")}</span></div>
      <div class="info-row"><span class="info-label">Controllers</span><span class="info-value">${escapeHtml(cluster?.cluster_size ?? "Not reported")}</span></div>
      <div class="info-row"><span class="info-label">Cluster state</span><span class="info-value">${badge(health?.status || cluster?.state || health?.clustering || "unknown")}</span></div>
      <div class="info-row"><span class="info-label">Healthy instances</span><span class="info-value">${escapeHtml(metrics?.instances?.healthy ?? "Not reported")}</span></div>
    </div>`;
  }

  async function renderApps() {
    main.innerHTML = pageHeading("Applications", "Find, start, stop, scale, and inspect your applications.", `<a class="button button-primary" href="#/create">+ Create application</a>`) +
      `<section class="card"><div id="apps-list">${loading("Loading applications…")}</div></section>`;
    try {
      const data = await api("/apps");
      if (main.isConnected) document.querySelector("#apps-list").innerHTML = listTable(appEntries(data));
    } catch (error) {
      const target = document.querySelector("#apps-list");
      if (target) target.innerHTML = panelError(error, "reload");
    }
  }

  function detailTabs(name, active) {
    const tabs = [["status", "Overview"], ["metrics", "Metrics"], ["logs", "Logs"], ["configuration", "Configuration"], ["events", "Events"]];
    return `<nav class="tabs" aria-label="Application sections">${tabs.map(([key, label]) => `<a class="tab ${active === key ? "active" : ""}" href="#/app/${encodeURIComponent(name)}/${key}" ${active === key ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
  }

  async function renderAppDetail(name, section = "status") {
    main.innerHTML = pageHeading(name, "Application status, settings, and diagnostic information.", `<div class="inline-actions"><button class="button button-primary button-small" data-action="start" data-app="${escapeHtml(name)}">Start</button><button class="button button-danger button-small" data-action="stop" data-app="${escapeHtml(name)}">Stop</button><button class="button button-outline button-small" data-action="delete" data-app="${escapeHtml(name)}">Delete</button></div>`) +
      `<section class="card card-pad"><div id="app-detail">${loading("Loading application details…")}</div></section>`;
    const target = document.querySelector("#app-detail");
    try {
      if (section === "status") {
        const result = await api(appUrl(name, "/status"));
        if (target) target.innerHTML = detailTabs(name, section) + `<div class="grid grid-2"><div class="info-list">
          <div class="info-row"><span class="info-label">Status</span><span class="info-value">${badge(result.status)}</span></div>
          <div class="info-row"><span class="info-label">Ready / desired replicas</span><span class="info-value">${escapeHtml(result.ready_replicas ?? "—")} / ${escapeHtml(result.replicas ?? "—")}</span></div>
          <div class="info-row"><span class="info-label">Scaling mode</span><span class="info-value">${escapeHtml(titleCase(result.mode || "auto"))}</span></div>
          <div class="info-row"><span class="info-label">Instances reported</span><span class="info-value">${escapeHtml(Array.isArray(result.instances) ? result.instances.length : "—")}</span></div>
        </div><div><h3>Scale this application</h3><form data-form="scale"><div class="field"><label for="replica-count">Desired number of instances</label><input id="replica-count" name="replicas" type="number" min="0" max="100" value="${escapeHtml(result.replicas ?? 1)}" required><span class="field-help">Choose between 0 and 100 instances.</span></div><p style="margin:12px 0 0"><button class="button button-primary" type="submit">Save replica count</button></p></form></div></div>
        <div class="section-head" style="margin-top:22px"><h2>Current status details</h2><button class="button button-small button-outline" data-action="refresh-app" data-app="${escapeHtml(name)}">Refresh</button></div>${jsonBlock(result)}`;
      } else if (section === "metrics") {
        const result = await api(appUrl(name, "/metrics"));
        if (target) target.innerHTML = detailTabs(name, section) + `<h2>Application metrics and scaling history</h2><p class="subtitle">Values shown here come from the controller's metrics response.</p>${jsonBlock(result)}`;
      } else if (section === "logs") {
        const result = await api(`${appUrl(name, "/logs")}?lines=100`);
        const logs = Array.isArray(result?.logs) ? result.logs : [];
        if (target) target.innerHTML = detailTabs(name, section) + `<div class="section-head"><div><h2>Application logs</h2><p class="section-subtitle">${escapeHtml(logs.length)} log lines returned by the API.</p></div><button class="button button-small button-outline" data-action="refresh-app" data-app="${escapeHtml(name)}">Refresh</button></div>${logs.length ? `<div class="log-list">${logs.map((line) => `<div class="log-line">${escapeHtml(line.timestamp ? new Date(number(line.timestamp) * 1000).toLocaleString() : "")} ${escapeHtml(line.container || "")} ${escapeHtml(line.message || line)}</div>`).join("")}</div>` : `<div class="empty-state"><strong>No log lines returned</strong>The application may be stopped or may not have produced logs yet.</div>`}`;
      } else if (section === "configuration") {
        const result = await api(appUrl(name, "/raw"));
        if (target) target.innerHTML = detailTabs(name, section) + `<h2>Application configuration</h2><p class="subtitle">Raw and normalized specification data returned by Orchestry.</p>${jsonBlock(result)}`;
      } else if (section === "events") {
        const result = await api(`/events?app=${encodeURIComponent(name)}&limit=100`);
        if (target) target.innerHTML = detailTabs(name, section) + eventList(result?.events || []);
      } else {
        location.hash = `#/app/${encodeURIComponent(name)}/status`;
      }
    } catch (error) {
      if (target) target.innerHTML = detailTabs(name, section) + panelError(error, "refresh-app");
    }
  }

  function eventList(events) {
    if (!Array.isArray(events) || !events.length) return `<div class="empty-state"><strong>No recent events</strong>There are no matching events to show.</div>`;
    return `<div class="table-wrap"><table><thead><tr><th>When</th><th>Application</th><th>Event</th><th>Details</th></tr></thead><tbody>${events.map((event) => `<tr><td>${escapeHtml(event.timestamp ? new Date(number(event.timestamp) * 1000).toLocaleString() : "—")}</td><td>${escapeHtml(event.app_name || event.app || "—")}</td><td>${escapeHtml(titleCase(event.event_type || "event"))}</td><td>${escapeHtml(event.message || (event.details ? JSON.stringify(event.details) : "—"))}</td></tr>`).join("")}</tbody></table></div>`;
  }

  async function renderCluster() {
    main.innerHTML = pageHeading("Cluster status", "Understand which controllers are healthy and which one is leading.") +
      `<div id="cluster-health" style="margin-bottom:16px">${loading()}</div><div class="grid grid-2">
      <section class="card card-pad"><h2>Controller cluster</h2><div id="cluster-status">${loading()}</div></section>
      <section class="card card-pad"><h2>Current leader</h2><div id="cluster-leader">${loading()}</div></section></div>`;
    const [health, status, leader] = await Promise.allSettled([api("/cluster/health"), api("/cluster/status"), api("/cluster/leader")]);
    if (!main.isConnected) return;
    if (health.status === "fulfilled") {
      const state = health.value.status || "unknown";
      const css = state === "healthy" ? "" : state === "degraded" ? "warning" : "error";
      document.querySelector("#cluster-health").innerHTML = `<div class="health-banner ${css}"><span class="health-icon">${state === "healthy" ? "✓" : "!"}</span><div><div class="health-title">Cluster ${escapeHtml(titleCase(state))}</div><p class="health-copy">${escapeHtml(health.value.clustering || "")} ${escapeHtml(health.value.error || "")}</p></div><button class="button button-small button-outline" data-action="reload">Refresh</button></div>`;
    } else document.querySelector("#cluster-health").innerHTML = panelError(health.reason, "reload");
    document.querySelector("#cluster-status").innerHTML = status.status === "fulfilled" ? jsonBlock(status.value) : panelError(status.reason, "reload");
    document.querySelector("#cluster-leader").innerHTML = leader.status === "fulfilled" ? jsonBlock(leader.value) : panelError(leader.reason, "reload");
  }

  async function renderMetrics() {
    main.innerHTML = pageHeading("System metrics", "A readable view of the application and instance counts returned by Orchestry.") +
      `<section class="card card-pad"><div class="section-head"><h2>Current system summary</h2><button class="button button-small button-outline" data-action="reload">Refresh</button></div><div id="system-metrics">${loading()}</div></section>`;
    try {
      const data = await api("/metrics");
      const target = document.querySelector("#system-metrics");
      if (!target) return;
      target.innerHTML = `<div class="grid grid-4">
        ${statCard("Applications", data?.apps?.total ?? "—", "Registered apps", "▦")}
        ${statCard("Running apps", data?.apps?.running ?? "—", "Currently active", "▶")}
        ${statCard("Instances", data?.instances?.total ?? "—", "Across applications", "◉")}
        ${statCard("Healthy instances", data?.instances?.healthy ?? "—", "Reported as healthy", "✓")}
      </div><h3 style="margin-top:20px">Additional details from the controller</h3>${jsonBlock(data)}`;
    } catch (error) {
      const target = document.querySelector("#system-metrics");
      if (target) target.innerHTML = panelError(error, "reload");
    }
  }

  async function renderEvents(appFilter = "", eventLimit = 100) {
    main.innerHTML = pageHeading("Events", "Review recent changes and activity reported by Orchestry.") +
      `<section class="card card-pad"><form class="toolbar" data-form="events"><label for="event-app-filter">Filter by app</label><input id="event-app-filter" name="app" value="${escapeHtml(appFilter)}" placeholder="All applications"><label for="event-limit">Show</label><select id="event-limit" name="limit"><option value="25" ${eventLimit === 25 ? "selected" : ""}>25</option><option value="100" ${eventLimit === 100 ? "selected" : ""}>100</option><option value="250" ${eventLimit === 250 ? "selected" : ""}>250</option></select><span>events</span><button class="button button-primary button-small" type="submit">Apply filter</button></form><div id="events-content" style="margin-top:17px">${loading()}</div></section>`;
    try {
      const query = new URLSearchParams({ limit: String(eventLimit) });
      if (appFilter) query.set("app", appFilter);
      const data = await api(`/events?${query}`);
      const target = document.querySelector("#events-content");
      if (target) target.innerHTML = eventList(data?.events || []);
    } catch (error) {
      const target = document.querySelector("#events-content");
      if (target) target.innerHTML = panelError(error, "reload");
    }
  }

  function field(label, name, value, help, type = "text", required = false, attrs = "") {
    return `<div class="field"><label for="wizard-${name}">${escapeHtml(label)}${required ? " *" : ""}</label><input id="wizard-${name}" name="${name}" data-field="${name}" type="${type}" value="${escapeHtml(value)}" ${required ? "required" : ""} ${attrs}><span class="field-help">${escapeHtml(help)}</span></div>`;
  }

  function currentWizardPayload() {
    const labels = { app: wizardData.name, version: wizardData.version };
    const environment = wizardData.environment.split(/\r?\n/).filter(Boolean).map((row) => {
      const split = row.indexOf("=");
      if (split < 1) throw new Error(`Environment entry "${row}" must use NAME=VALUE.`);
      return { name: row.slice(0, split).trim(), value: row.slice(split + 1) };
    });
    return {
      apiVersion: "v1",
      kind: "App",
      metadata: { name: wizardData.name, labels },
      spec: {
        type: wizardData.appType,
        image: wizardData.image,
        ports: [{ containerPort: number(wizardData.port), protocol: "HTTP" }],
        resources: { cpu: wizardData.cpu, memory: wizardData.memory },
        environment
      },
      scaling: {
        mode: wizardData.scalingMode,
        minReplicas: number(wizardData.minReplicas),
        maxReplicas: number(wizardData.maxReplicas),
        targetRPSPerReplica: number(wizardData.targetRPSPerReplica),
        maxP95LatencyMs: number(wizardData.maxP95LatencyMs),
        scaleOutThresholdPct: number(wizardData.scaleOutThresholdPct),
        scaleInThresholdPct: number(wizardData.scaleInThresholdPct),
        windowSeconds: number(wizardData.windowSeconds),
        cooldownSeconds: number(wizardData.cooldownSeconds)
      },
      healthCheck: { path: wizardData.healthPath, port: number(wizardData.healthPort) }
    };
  }

  function wizardContent(step) {
    if (step === 0) return `<div class="field-grid">${field("Application name", "name", wizardData.name, "A short unique name, for example my-web-app.", "text", true, 'pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"')}${field("Application version", "version", wizardData.version, "A label to help identify this release.")}<div class="field"><label for="wizard-appType">Application type *</label><select id="wizard-appType" name="appType" data-field="appType"><option value="http" ${wizardData.appType === "http" ? "selected" : ""}>HTTP web application</option></select><span class="field-help">Orchestry currently documents HTTP applications.</span></div></div>`;
    if (step === 1) return `<div class="field-grid">${field("Container image", "image", wizardData.image, "Image name to run, for example nginx:alpine.", "text", true)}${field("Container port", "port", wizardData.port, "The port your app listens on inside its container.", "number", true, 'min="1" max="65535"')}${field("CPU allowance", "cpu", wizardData.cpu, "Example: 100m (0.1 CPU core).")}${field("Memory allowance", "memory", wizardData.memory, "Example: 128Mi.") }<div class="field field-full"><label for="wizard-environment">Environment variables (optional)</label><textarea id="wizard-environment" name="environment" data-field="environment" placeholder="NAME=value, one per line">${escapeHtml(wizardData.environment)}</textarea><span class="field-help">Do not enter passwords or secrets here unless your deployment is configured to protect them.</span></div></div>`;
    if (step === 2) return `<fieldset style="border:0;padding:0;margin:0"><legend style="font-size:12px;font-weight:700;margin-bottom:12px">How should Orchestry scale this app?</legend><div class="grid grid-2"><label class="card card-pad"><input type="radio" name="scalingMode" data-field="scalingMode" value="auto" ${wizardData.scalingMode === "auto" ? "checked" : ""}> Automatic scaling <span class="field-help">Orchestry adjusts instances using traffic and policy.</span></label><label class="card card-pad"><input type="radio" name="scalingMode" data-field="scalingMode" value="manual" ${wizardData.scalingMode === "manual" ? "checked" : ""}> Manual scaling <span class="field-help">You choose the replica count yourself.</span></label></div></fieldset><div class="field-grid" style="margin-top:15px">${field("Minimum instances", "minReplicas", wizardData.minReplicas, "Lowest number of app instances.", "number", true, 'min="0" max="100"')}${field("Maximum instances", "maxReplicas", wizardData.maxReplicas, "Highest number of app instances.", "number", true, 'min="1" max="100"')}${field("Requests per instance", "targetRPSPerReplica", wizardData.targetRPSPerReplica, "Traffic target used by the autoscaler.", "number", true, 'min="1"')}${field("Maximum response latency (ms)", "maxP95LatencyMs", wizardData.maxP95LatencyMs, "Latency threshold used for scaling.", "number", true, 'min="1"')}</div>`;
    if (step === 3) return `<p class="subtitle" style="margin-bottom:14px">Orchestry can check a URL on your app to help determine whether it is responding.</p><div class="field-grid">${field("Health-check path", "healthPath", wizardData.healthPath, "Path checked on your application, for example /health.")}${field("Health-check port", "healthPort", wizardData.healthPort, "Port used for the health check.", "number", true, 'min="1" max="65535"')}</div>`;
    let payload;
    try { payload = currentWizardPayload(); } catch (error) { payload = { note: error.message }; }
    return `<h2>Review before registering</h2><p class="subtitle" style="margin-bottom:15px">Check these settings. Orchestry will use the existing application registration API.</p><div class="summary-list">
      <div class="summary-item"><span>Application</span><strong>${escapeHtml(wizardData.name || "Not entered")}</strong></div>
      <div class="summary-item"><span>Type and image</span><strong>${escapeHtml(wizardData.appType)} · ${escapeHtml(wizardData.image || "Not entered")}</strong></div>
      <div class="summary-item"><span>Port and resources</span><strong>${escapeHtml(wizardData.port)} · ${escapeHtml(wizardData.cpu)} CPU · ${escapeHtml(wizardData.memory)}</strong></div>
      <div class="summary-item"><span>Scaling range</span><strong>${escapeHtml(wizardData.minReplicas)} to ${escapeHtml(wizardData.maxReplicas)} instances</strong></div>
      <div class="summary-item"><span>Health check</span><strong>${escapeHtml(wizardData.healthPath)}:${escapeHtml(wizardData.healthPort)}</strong></div>
      <div class="summary-item"><span>Scaling mode</span><strong>${escapeHtml(titleCase(wizardData.scalingMode))}</strong></div>
    </div><details style="margin-top:16px"><summary class="button button-outline button-small">Advanced: review generated JSON</summary>${jsonBlock(payload)}</details>`;
  }

  function renderWizard(step = 0) {
    const bounded = Math.min(Math.max(step, 0), wizardSteps.length - 1);
    main.innerHTML = pageHeading("Create application", "Follow the steps to tell Orchestry how to run your app.", `<a class="button button-outline" href="#/apps">Cancel</a>`) +
      `<section class="card card-pad">
      <div class="stepper" aria-label="Registration progress">${wizardSteps.map((label, index) => `<div class="step ${index === bounded ? "active" : index < bounded ? "done" : ""}"><span class="step-index">${index < bounded ? "✓" : index + 1}</span>${label}</div>`).join("")}</div>
      <form id="registration-wizard" data-form="wizard" novalidate><div class="step-content">${wizardContent(bounded)}</div>
      <div id="wizard-error" role="alert"></div><div class="form-footer">
      <button class="button button-outline" type="button" data-action="wizard-prev" ${bounded === 0 ? "disabled" : ""}>← Previous</button>
      ${bounded < wizardSteps.length - 1 ? `<button class="button button-primary" type="button" data-action="wizard-next">Next step →</button>` : `<button class="button button-primary" type="button" data-action="register-submit">Register application</button>`}
      </div><input type="hidden" name="wizard-step" value="${bounded}"></form></section>`;
  }

  function readWizardForm() {
    const form = document.querySelector("#registration-wizard");
    if (!form) return;
    new FormData(form).forEach((value, key) => {
      if (key in wizardData) wizardData[key] = String(value);
    });
  }

  function validateWizard(step) {
    readWizardForm();
    const form = document.querySelector("#registration-wizard");
    const fieldsByStep = [
      ["name"],
      ["image", "port"],
      ["minReplicas", "maxReplicas", "targetRPSPerReplica", "maxP95LatencyMs"],
      ["healthPort"],
      []
    ];
    const requiredFields = fieldsByStep[step] || [];
    let firstInvalid = null;
    for (const name of requiredFields) {
      const input = form?.elements.namedItem(name);
      const valid = input && input.checkValidity() && (name !== "name" || /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(wizardData.name));
      if (!valid) {
        input?.setAttribute("aria-invalid", "true");
        firstInvalid ||= input;
      } else input.removeAttribute("aria-invalid");
    }
    if (step === 2 && number(wizardData.minReplicas) > number(wizardData.maxReplicas)) {
      const input = form?.elements.namedItem("maxReplicas");
      input?.setAttribute("aria-invalid", "true");
      firstInvalid ||= input;
      document.querySelector("#wizard-error").innerHTML = `<div class="error-panel">Maximum instances must be at least the minimum.</div>`;
    }
    if (firstInvalid) {
      if (!document.querySelector("#wizard-error").innerHTML) document.querySelector("#wizard-error").innerHTML = `<div class="error-panel">Please check the required fields before continuing.</div>`;
      firstInvalid.focus();
      return false;
    }
    document.querySelector("#wizard-error").innerHTML = "";
    return true;
  }

  async function renderAdvanced() {
    main.innerHTML = pageHeading("Advanced tools", "Specialist operations. These can change app behavior or add simulated data.") +
      `<div class="advanced-note"><strong>For experienced users:</strong> Use these controls only when you understand their effect. Simulated metrics are test input, not measurements from real traffic.</div>
      <div class="grid grid-2">
        <section class="card card-pad"><h2>Update scaling policy</h2><p class="subtitle" style="margin-bottom:14px">Set detailed automatic-scaling thresholds.</p>
          <form data-form="policy"><div class="field-grid"><div class="field field-full"><label for="policy-app">Application</label><select id="policy-app" name="app" required><option value="">Choose an application</option></select></div>
          ${field("Minimum instances", "minReplicas", "1", "Lowest permitted instance count.", "number", true, 'min="0"')}
          ${field("Maximum instances", "maxReplicas", "5", "Highest permitted instance count.", "number", true, 'min="1"')}
          ${field("Requests per instance", "targetRPSPerReplica", "50", "Traffic target for each instance.", "number", true, 'min="1"')}
          ${field("Maximum p95 latency (ms)", "maxP95LatencyMs", "250", "Scale based on response time.", "number", true, 'min="1"')}
          ${field("Scale out threshold (%)", "scaleOutThresholdPct", "80", "Usage level at which to add instances.", "number", true, 'min="0" max="100"')}
          ${field("Scale in threshold (%)", "scaleInThresholdPct", "30", "Usage level below which to remove instances.", "number", true, 'min="0" max="100"')}</div><p style="margin:14px 0 0"><button class="button button-primary" type="submit">Save scaling policy</button></p></form>
        </section>
        <section class="card card-pad"><h2>Simulate traffic and metrics</h2><p class="subtitle" style="margin-bottom:14px">Send test values to the controller. This may cause autoscaling if evaluation is enabled.</p>
          <form data-form="simulate"><div class="field-grid"><div class="field field-full"><label for="simulate-app">Application</label><select id="simulate-app" name="app" required><option value="">Choose an application</option></select></div>
          ${field("Requests per second", "rps", "0", "Simulated request rate.", "number", true, 'min="0" step="any"')}
          ${field("p95 latency (ms)", "p95LatencyMs", "0", "Simulated response latency.", "number", true, 'min="0" step="any"')}
          ${field("Active connections", "activeConnections", "0", "Simulated open connections.", "number", true, 'min="0"')}
          ${field("CPU usage (%)", "cpuPercent", "0", "Simulated CPU percentage.", "number", true, 'min="0" max="100"')}
          ${field("Memory usage (%)", "memoryPercent", "0", "Simulated memory percentage.", "number", true, 'min="0" max="100"')}
          ${field("Healthy instances (optional)", "healthyReplicas", "", "Leave blank when not setting this value.", "number", false, 'min="0"')}
          <div class="field field-full"><label><input type="checkbox" name="evaluate" checked> Evaluate these values for scaling</label><span class="field-help">When checked, Orchestry may scale the app based on this test input.</span></div></div><p style="margin:14px 0 0"><button class="button button-primary" type="submit">Send simulated values</button></p></form><div id="simulation-result" style="margin-top:15px"></div>
        </section>
      </div>`;
    try {
      const apps = appEntries(await api("/apps"));
      for (const select of document.querySelectorAll("#policy-app, #simulate-app")) {
        apps.forEach((record) => {
          const option = document.createElement("option");
          option.value = appName(record);
          option.textContent = appName(record);
          select.append(option);
        });
      }
    } catch (error) {
      main.insertAdjacentHTML("beforeend", panelError(error));
    }
  }

  async function render() {
    const route = routeParts();
    navigation(route);
    const view = route[0] || "dashboard";
    if (view === "dashboard") return renderDashboard();
    if (view === "apps") return renderApps();
    if (view === "app") return renderAppDetail(route[1], route[2] || "status");
    if (view === "create") return renderWizard(number(route[1], 0));
    if (view === "cluster") return renderCluster();
    if (view === "metrics") return renderMetrics();
    if (view === "events") {
      return route[1] === "filter"
        ? renderEvents(route[2] === "all" ? "" : route[2] || "", number(route[3], 100))
        : renderEvents();
    }
    if (view === "advanced") return renderAdvanced();
    location.hash = "#/dashboard";
  }

  async function appAction(action, name, button) {
    if (!name) return;
    if (action === "stop" && !window.confirm(`Stop "${name}"? Its application instances will be stopped.`)) return;
    if (action === "delete" && !window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const request = {
      start: () => api(appUrl(name, "/up"), { method: "POST" }),
      stop: () => api(appUrl(name, "/down"), { method: "POST" }),
      delete: () => api(appUrl(name), { method: "DELETE" })
    }[action];
    if (!request) return;
    try {
      await request();
      if (action === "delete") location.hash = "#/apps";
      else await render();
    } catch (error) {
      toast(`Could not ${action} "${name}": ${error.message}`, "error");
    }
  }

  main.addEventListener("input", (event) => {
    const fieldElement = event.target.closest("[data-field]");
    if (fieldElement && fieldElement.name in wizardData) wizardData[fieldElement.name] = fieldElement.value;
  });
  main.addEventListener("change", (event) => {
    const fieldElement = event.target.closest("[data-field]");
    if (fieldElement && fieldElement.name in wizardData) wizardData[fieldElement.name] = fieldElement.value;
  });
  main.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "reload") return render();
    if (action === "start" || action === "stop" || action === "delete") return appAction(action, button.dataset.app, button);
    if (action === "refresh-app") return renderAppDetail(button.dataset.app, routeParts()[2] || "status");
    if (action === "wizard-prev") {
      readWizardForm();
      return renderWizard(Math.max(0, number(routeParts()[1]) - 1));
    }
    if (action === "wizard-next") {
      const step = number(routeParts()[1]);
      if (validateWizard(step)) {
        readWizardForm();
        location.hash = `#/create/${Math.min(step + 1, 4)}`;
      }
    }
    if (action === "register-submit") {
      if (!validateWizard(4)) return;
      let payload;
      try { payload = currentWizardPayload(); } catch (error) {
        document.querySelector("#wizard-error").innerHTML = `<div class="error-panel">${escapeHtml(error.message)}</div>`;
        return;
      }
      button.disabled = true;
      try {
        const result = await api("/apps/register", { method: "POST", body: JSON.stringify(payload) });
        toast(result?.message || `Application "${payload.metadata.name}" was registered.`);
        location.hash = "#/apps";
      } catch (error) {
        document.querySelector("#wizard-error").innerHTML = `<div class="error-panel"><strong>Registration was not completed.</strong> ${escapeHtml(error.message)}</div>`;
        button.disabled = false;
      }
    }
  });

  main.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const values = Object.fromEntries(new FormData(form).entries());
    if (form.dataset.form === "scale") {
      const name = routeParts()[1];
      const replicas = number(values.replicas, -1);
      if (!Number.isInteger(replicas) || replicas < 0 || replicas > 100) return toast("Choose a whole number from 0 to 100.", "error");
      try {
        await api(appUrl(name, "/scale"), { method: "POST", body: JSON.stringify({ replicas }) });
        toast(`Replica count updated for "${name}".`);
        await renderAppDetail(name, "status");
      } catch (error) { toast(`Could not scale "${name}": ${error.message}`, "error"); }
    } else if (form.dataset.form === "policy") {
      const policy = {};
      ["minReplicas", "maxReplicas", "targetRPSPerReplica", "maxP95LatencyMs", "scaleOutThresholdPct", "scaleInThresholdPct"].forEach((key) => { policy[key] = number(values[key]); });
      if (policy.minReplicas > policy.maxReplicas) return toast("Maximum instances must be at least the minimum.", "error");
      try {
        await api(appUrl(values.app, "/policy"), { method: "POST", body: JSON.stringify({ policy }) });
        toast(`Scaling policy updated for "${values.app}".`);
      } catch (error) { toast(`Could not update policy: ${error.message}`, "error"); }
    } else if (form.dataset.form === "simulate") {
      const body = {
        rps: number(values.rps),
        p95LatencyMs: number(values.p95LatencyMs),
        activeConnections: number(values.activeConnections),
        cpuPercent: number(values.cpuPercent),
        memoryPercent: number(values.memoryPercent),
        evaluate: form.elements.evaluate.checked
      };
      if (values.healthyReplicas !== "") body.healthyReplicas = number(values.healthyReplicas);
      const output = document.querySelector("#simulation-result");
      try {
        const result = await api(appUrl(values.app, "/simulateMetrics"), { method: "POST", body: JSON.stringify(body) });
        if (output) output.innerHTML = `<h3>Controller response</h3>${jsonBlock(result)}`;
        toast("Simulated values were accepted by the controller.");
      } catch (error) {
        if (output) output.innerHTML = panelError(error);
        toast(`The simulated values were not accepted: ${error.message}`, "error");
      }
    } else if (form.dataset.form === "events") {
      const query = new URLSearchParams({ limit: values.limit || "100" });
      if (values.app) query.set("app", values.app);
      location.hash = `#/events/filter/${values.app ? encodeURIComponent(values.app) : "all"}/${values.limit || 100}`;
      try {
        const data = await api(`/events?${query}`);
        const target = document.querySelector("#events-content");
        if (target) target.innerHTML = eventList(data?.events || []);
      } catch (error) {
        const target = document.querySelector("#events-content");
        if (target) target.innerHTML = panelError(error);
      }
    }
  });

  window.addEventListener("hashchange", render);
  if (!location.hash) history.replaceState(null, "", `${location.pathname}${location.search}#/dashboard`);
  render();
})();
