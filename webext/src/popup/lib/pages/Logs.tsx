import * as State from "../State";

export default function Page() {
  return (
    <section class="column gap-xl">

      { /* Header */}
      <div class="row align-baseline">
        <h2 class="L3">Logs</h2>
        <button class="button" onClick={() => State.logsClear()}>
          Clear <span class="icon -close" />
        </button>
      </div>

      { /* Contents */}
      <div class="gap-s">
        {State.logs.value.map((log) => (
          <div
            class="mono color-secondary"
            style={{
              whiteSpace: "pre-wrap",
              overflowX: "scroll",
              overflowY: "visible",
              paddingRight: "1em",
              paddingBottom: "1em",
            }}
          >
            {log}
          </div>
        ))}
      </div>
    </section>
  );
}
