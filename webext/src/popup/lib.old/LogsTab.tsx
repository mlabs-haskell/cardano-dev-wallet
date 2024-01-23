import * as State from "./State";

export function LogsTab() {
  let logs = State.logs.value;

  const clearLogs = () => State.logsClear();

  return (
    <div class="column pad-s gap-s">
      <div class="column surface gap-0 div-y">
        <div class="row pad-s">
          <h3>Logs</h3>
          <div class="grow-1" />
          <button onClick={clearLogs}>Clear</button>
        </div>
        {logs.length == 0 && <div class="pad-s">empty</div>}

        {logs.map((log) => (
          <div class="mono pad-s">{log}</div>
        ))}
      </div>
    </div>
  );
}
