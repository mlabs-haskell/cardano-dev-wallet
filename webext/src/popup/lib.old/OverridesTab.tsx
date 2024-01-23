export function OverridesTab() {
  return (
    <div class="pad-m column gap-l">
      <h1>Overrides</h1>
      <div class="surface pad-s column gap-m">
        {["", "green", "orange", "red"].map((c) => <Demo klass={c} />)}
        <div class="surface pad-s column gap-m">
          {["", "green", "orange", "red"].map((c) => <Demo klass={c} />)}
        </div>
      </div>
    </div>
  );
}

function Demo({ klass }: { klass: string }) {
  return <>
    <div class={klass + " row align-end"} style={{ flexWrap: "wrap" }}>
      <label style={{ width: 0, flexGrow: 1 }}>Name
        <input value="Test" />
      </label>
      <label style={{ width: 0, flexGrow: 1 }}>Name
        <input class="" placeholder="Test" />
      </label>
    </div>
    <div class={klass + " row align-end"} style={{ flexWrap: "wrap" }}>
      <button class="">Hello</button>
      <button disabled>Hello</button>
      <button class="secondary">Hello</button>
      <button disabled class="secondary">Hello</button>
    </div>
  </>
}
