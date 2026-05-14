import type { Campaign } from "../types/campaign";

type Props = {
  campaigns: Campaign[];
};

function hoursRemaining(isoDate: string): number {
  const end = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((end - now) / (1000 * 60 * 60));
}

function formatWindow(hours: number): string {
  if (hours <= 0) return "Ended";
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
}

export default function CountdownManager({ campaigns }: Props) {
  const countdowns = campaigns
    .filter((c) => c.countdown?.enabled && c.countdown.endsAt)
    .map((c) => {
      const endsAt = c.countdown?.endsAt as string;
      const remaining = hoursRemaining(endsAt);
      const threshold = c.countdown?.urgencyThresholdHours ?? 24;
      const urgency = remaining > 0 && remaining <= threshold;
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        remaining,
        urgency,
        endsAt,
        label: c.countdown?.label || "Sale ends in",
      };
    })
    .sort((a, b) => a.remaining - b.remaining);

  return (
    <section className="row g-4">
      <div className="col-12 countdown-header">
        <h1>Countdown Timers</h1>
        <p>Manage urgency bars and end-of-sale messaging for live and scheduled promotions.</p>
      </div>

      {countdowns.length === 0 ? (
        <div className="col-12">
          <div className="panel empty-state">
            <p>No active timers yet. Enable countdown in a campaign schedule to add one.</p>
          </div>
        </div>
      ) : (
        countdowns.map((timer) => (
          <div key={timer.id} className="col-12 col-md-6 col-lg-4">
            <article className="panel countdown-card h-100">
              <div className="countdown-card-head">
                <h3>{timer.name}</h3>
                <span className={`timer-pill ${timer.urgency ? "urgent" : "stable"}`}>
                  {timer.urgency ? "Urgent" : "Running"}
                </span>
              </div>
              <p className="countdown-type">{timer.type} • {timer.status}</p>
              <div className="countdown-metric">{timer.label}: {formatWindow(timer.remaining)}</div>
              <p className="countdown-meta">Ends at {new Date(timer.endsAt).toLocaleString()}</p>
            </article>
          </div>
        ))
      )}
    </section>
  );
}
