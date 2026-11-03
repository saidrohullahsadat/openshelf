import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";

function AdminTools({ api, apiBase, tr }) {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() =>
      searchParams.get("tab") === "storage" ? "storage" : "books",
    ),
    [payload, setPayload] = useState(null),
    [error, setError] = useState(""),
    [migrationResult, setMigrationResult] = useState(null);
  const sources = {
    books: ["/admin/books", "books"],
    users: ["/admin/users", "users"],
    categories: ["/admin/categories", "categories"],
    reports: ["/admin/reports", "reports"],
    ratings: ["/admin/ratings", "ratings"],
    audit: ["/admin/audit-logs", "logs"],
    credits: ["/admin/settings/credits", "policy"],
    storage: ["/admin/storage/google-drive", "storage"],
  };
  const load = () => {
    setError("");
    api(sources[tab][0])
      .then(setPayload)
      .catch((e) => setError(e.message));
  };
  useEffect(() => {
    load();
  }, [tab]);
  const act = async (path, method, body) => {
    try {
      await api(path, { method, body: JSON.stringify(body) });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const items = payload?.[sources[tab][1]] || [];
  const driveError = searchParams.get("drive_error");
  return (
    <section className="admin-tools">
      <div className="section-heading">
        <div>
          <h2>{tr("Full access controls")}</h2>
          <p>
            {tr(
              "Manage books, readers, categories, reports, reviews, moderation, audit history, and download rules.",
            )}
          </p>
        </div>
      </div>
      <div className="dashboard-tabs admin-tool-tabs">
        {Object.keys(sources).map((name) => (
          <button
            key={name}
            className={tab === name ? "tab-active" : ""}
            onClick={() => setTab(name)}
          >
            {tr(name[0].toUpperCase() + name.slice(1))}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      {driveError && (
        <p className="form-error">
          {driveError === "configuration"
            ? tr("Add the Google OAuth settings and Drive token key before connecting.")
            : tr("Google Drive connection failed. Check the Drive API, consent screen, and test user.")}
        </p>
      )}
      {searchParams.get("drive") === "connected" && (
        <p className="notice">{tr("New production PDFs are stored in private Vercel Blob. This Google Drive connection is retained for legacy files.")}</p>
      )}
      {tab === "credits" && payload?.policy && (
        <form
          className="form credit-settings"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await act(sources.credits[0], "PATCH", {
              freeDownloads: Number(f.get("freeDownloads")),
              contributionsPerUnlock: Number(f.get("contributionsPerUnlock")),
              downloadsPerUnlock: Number(f.get("downloadsPerUnlock")),
              allowRepeatDownload: f.get("allowRepeatDownload") === "on",
            });
          }}
        >
          <label>
            {tr("Free distinct downloads")}
            <input
              name="freeDownloads"
              type="number"
              min="0"
              max="100"
              defaultValue={payload.policy.freeDownloads}
            />
          </label>
          <label>
            {tr("Approved contributions per unlock")}
            <input
              name="contributionsPerUnlock"
              type="number"
              min="1"
              max="100"
              defaultValue={payload.policy.contributionsPerUnlock}
            />
          </label>
          <label>
            {tr("Downloads per unlock")}
            <input
              name="downloadsPerUnlock"
              type="number"
              min="1"
              max="100"
              defaultValue={payload.policy.downloadsPerUnlock}
            />
          </label>
          <label>
            <input
              type="checkbox"
              name="allowRepeatDownload"
              defaultChecked={payload.policy.allowRepeatDownload}
            />{" "}
            {tr("Allow free repeat downloads")}
          </label>
          <button className="button">{tr("Save credit rules")}</button>
        </form>
      )}
      {tab === "storage" && payload?.storage && (
        <div className="drive-storage-panel">
          <div>
            <strong>{tr("Google Drive storage")}</strong>
            <p>
              {payload.storage.connected
                ? `${tr("Connected account")}: ${payload.storage.email}`
                : tr("Google Drive is not connected. New production uploads use private Vercel Blob.")}
            </p>
            {payload.storage.connected && (
              <p>{tr("New production uploads use private Vercel Blob; existing Drive files remain readable.")}</p>
            )}
          </div>
          {!payload.storage.connected ? (
            <a className="button" href={`${apiBase}/auth/google/drive/connect`}>
              {tr("Connect Google Drive")}
            </a>
          ) : (
            <button
              className="button"
              onClick={async () => {
                setError("");
                setMigrationResult(null);
                try {
                  const result = await api(sources.storage[0] + "/migrate", {
                    method: "POST",
                    body: JSON.stringify({}),
                  });
                  setMigrationResult(result);
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              {tr("Copy existing local PDFs to Drive")}
            </button>
          )}
          {migrationResult && (
            <p className="notice">
              {tr("Copied to Drive")}: {migrationResult.migrated}; {tr("Failed")}: {migrationResult.failed.length}
            </p>
          )}
        </div>
      )}
      {tab !== "credits" && tab !== "storage" && (
        <div className="admin-tool-list">
          {tab === "books" &&
            items.map((row) => (
              <div className="admin-tool-row" key={row.id}>
                <strong>{row.title}</strong>
                <span>
                  {row.author} · {tr(row.status)} · AI indexing: {tr(row.indexingStatus || "pending")}
                </span>
                {row.indexingError && <small>{row.indexingError}</small>}
                <div>
                  {(row.indexingStatus === "failed" || row.indexingStatus === "pending") && <button className="button button-outline button-small" onClick={() => act(`/admin/books/${row.id}/index`, "POST", {})}>Retry indexing</button>}
                  <button
                    className="button button-small"
                    onClick={() =>
                      act(`/admin/books/${row.id}`, "PATCH", {
                        status: "approved",
                      })
                    }
                  >
                    {tr("Publish")}
                  </button>
                  <button
                    className="button button-outline button-small"
                    onClick={() =>
                      act(`/admin/books/${row.id}`, "PATCH", {
                        status: "rejected",
                      })
                    }
                  >
                    {tr("Reject")}
                  </button>
                </div>
              </div>
            ))}
          {tab === "users" &&
            items.map((row) => (
              <div className="admin-tool-row" key={row.id}>
                <strong>{row.name}</strong>
                <span>
                  {row.email} · {tr(row.role)} ·{" "}
                  {tr(row.suspended ? "suspended" : "active")}
                </span>
                <div>
                  <button
                    className="button button-small"
                    onClick={() =>
                      act(`/admin/users/${row.id}`, "PATCH", {
                        role: row.role === "admin" ? "user" : "admin",
                      })
                    }
                  >
                    {tr(row.role === "admin" ? "Make reader" : "Make admin")}
                  </button>
                  <button
                    className="button button-outline button-small"
                    onClick={() =>
                      act(`/admin/users/${row.id}`, "PATCH", {
                        suspended: !row.suspended,
                      })
                    }
                  >
                    {tr(row.suspended ? "Restore" : "Suspend")}
                  </button>
                </div>
              </div>
            ))}
          {tab === "categories" && (
            <>
              <button
                className="button button-small"
                onClick={async () => {
                  const name = prompt(tr("Category name"));
                  if (name) await act("/admin/categories", "POST", { name });
                }}
              >
                {tr("Add category")}
              </button>
              {items.map((row) => (
                <div className="admin-tool-row" key={row.id}>
                  <strong>{row.name}</strong>
                  <span>{tr(row.active ? "Active" : "Hidden")}</span>
                  <button
                    className="button button-outline button-small"
                    onClick={() =>
                      act(`/admin/categories/${row.id}`, "PATCH", {
                        active: !row.active,
                      })
                    }
                  >
                    {tr(row.active ? "Hide" : "Activate")}
                  </button>
                </div>
              ))}
            </>
          )}
          {tab === "reports" &&
            items.map((row) => (
              <div className="admin-tool-row" key={row.report.id}>
                <strong>
                  {row.book?.title || tr("Book unavailable")} · {tr(row.report.status)}
                </strong>
                <span>
                  {row.report.reason} — {row.user} ({row.email})
                </span>
                <div>
                  {["reviewing", "resolved", "dismissed"].map((status) => (
                    <button
                      className="button button-small"
                      key={status}
                      onClick={() =>
                        act(`/admin/reports/${row.report.id}`, "PATCH", {
                          status,
                        })
                      }
                    >
                      {tr(status)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          {tab === "ratings" &&
            items.map((row) => (
              <div className="admin-tool-row" key={row.rating.id}>
                <strong>
                  {row.book} · {row.rating.rating}/5
                </strong>
                <span>
                  {row.rating.review || tr("No written review")} — {row.user} (
                  {row.email})
                </span>
                <div>
                  <button
                    className="button button-small"
                    onClick={() =>
                      act(`/admin/ratings/${row.rating.id}`, "PATCH", {
                        status: "approved",
                      })
                    }
                  >
                    {tr("Approve")}
                  </button>
                  <button
                    className="button button-outline button-small"
                    onClick={() =>
                      act(`/admin/ratings/${row.rating.id}`, "PATCH", {
                        status: "rejected",
                      })
                    }
                  >
                    {tr("Reject")}
                  </button>
                </div>
              </div>
            ))}
          {tab === "audit" &&
            items.map((row) => (
              <div className="admin-tool-row" key={row.id}>
                <strong>{tr(row.action)}</strong>
                <span>
                  {tr(row.entity || "system")} {row.entityId || ""} ·{" "}
                  {new Date(row.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          {items.length === 0 && (
            <p className="empty-inline">{tr("Nothing to show here yet.")}</p>
          )}
        </div>
      )}
    </section>
  );
}
function Admin({ api, apiBase, tr, Cover }) {
  const [overview, setOverview] = useState(null),
    [contrib, setContrib] = useState([]),
    [error, setError] = useState("");
  const load = () =>
    Promise.all([api("/admin/overview"), api("/admin/contributions")])
      .then(([a, c]) => {
        setOverview(a);
        setContrib(c.contributions);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const review = async (id, status) => {
    const note =
      status === "rejected"
        ? prompt(tr("Reason for rejection (shown to the contributor):")) || ""
        : "";
    try {
      await api(`/admin/contributions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, note }),
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <div className="page-wrap dashboard">
      <div className="page-title-row">
        <div>
          <span className="eyebrow muted">{tr("LIBRARY MANAGEMENT")}</span>
          <h1>{tr("Admin dashboard.")}</h1>
          <p>{tr("Keep the collection thoughtful, useful, and growing.")}</p>
        </div>
        <span className="admin-badge">
          <ShieldCheck size={15} /> {tr("ADMIN")}
        </span>
      </div>
      {error && <p className="form-error">{error}</p>}
      {overview && (
        <>
          <div className="stats-grid admin-stats">
            {[
              ["REGISTERED READERS", overview.stats.users],
              ["PUBLISHED BOOKS", overview.stats.books],
              ["PENDING REVIEW", overview.stats.pending],
              ["DISTINCT DOWNLOADS", overview.stats.distinctDownloads],
            ].map(([x, n]) => (
              <div className="stat-card" key={x}>
                <span>{tr(x)}</span>
                <strong>{n}</strong>
              </div>
            ))}
          </div>
          <div className="section-heading admin-list-heading">
            <div>
              <h2>{tr("Submissions to review")}</h2>
              <p>{tr("Review the details and license before publishing.")}</p>
            </div>
          </div>
          {contrib.length ? (
            <div className="review-list">
              {contrib.map((x) => (
                <div className="review-row" key={x.contribution.id}>
                  <Cover book={x.book} />
                  <div className="review-info">
                    <strong>{x.book.title}</strong>
                    <span>
                      {x.book.author} · {tr("by")} {x.user} ({x.email})
                    </span>
                    <small>
                      {x.book.description || tr("No description provided.")}
                    </small>
                    {x.book.license && <small>{tr("License")}: {x.book.license}</small>}
                    <a
                      href={`${apiBase}/admin/contributions/${x.contribution.id}/file`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {tr("Preview document")} <ArrowRight size={13} />
                    </a>
                  </div>
                  <div className="review-actions">
                    <button
                      className="button button-small"
                      onClick={() => review(x.contribution.id, "approved")}
                    >
                      <Check size={14} /> {tr("Approve")}
                    </button>
                    <button
                      className="button button-outline button-small"
                      onClick={() => review(x.contribution.id, "rejected")}
                    >
                      {tr("Reject")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-inline">
                      <Check size={20} />
                      <span>{tr("All caught up. There are no submissions to review.")}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default function AdminPage({ api, apiBase, tr, Cover }) {
  return (
    <>
      <Admin api={api} apiBase={apiBase} tr={tr} Cover={Cover} />
      <AdminTools api={api} apiBase={apiBase} tr={tr} />
    </>
  );
}
