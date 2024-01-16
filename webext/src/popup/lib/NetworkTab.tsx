import * as State from "./State";
import { useState } from "preact/hooks";

export function NetworkTab() {
  let backends = State.backends.value;

  let [adding, setAdding] = useState(false);

  return (
    <div class="flex column pad">
      <div class="row">
        <h2>Network Backends</h2>
        <div class="grow-1" />
        <button
          onClick={() => {
            setAdding(true);
          }}
          disabled={adding}
        >
          Add Backend
        </button>
      </div>

      {adding && <BackendAddForm onClose={() => setAdding(false)} />}

      {Object.entries(backends).map(([backendId, backend]) => {
        return (
          <BackendCard
            key={backendId}
            backendId={backendId}
            backend={backend}
          />
        );
      })}
    </div>
  );
}

interface BackendCardProps {
  backendId: string;
  backend: State.BackendDef;
}

function BackendCard({ backendId, backend }: BackendCardProps) {
  let [renaming, setRenaming] = useState(false);
  let [name, setName] = useState(backend.name || "Unnamed");
  let [deleting, setDeleting] = useState(false);

  let isActive = backendId == State.backendsActiveId.value;

  const onRenameStart = () => setRenaming(true);
  const onRename = async () => {
    await State.backendsRename(backendId, name);
    setRenaming(false);
  };

  const onDeleteStart = () => setDeleting(true);
  const onDeleteCancel = () => setDeleting(false);
  const onDelete = async () => {
    await State.backendsDelete(backendId);
    setRenaming(false);
  };

  const makeActive = async () => {
    await State.backendsActiveSet(backendId);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
        alignItems: "stretch",
      }}
      class="surface pad-s"
    >
      <div class="row">
        {!renaming ? (
          <div class="h3">{name}</div>
        ) : (
          <div class="row">
            <input
              value={name}
              onInput={(ev) => setName(ev.currentTarget.value)}
            />
            <button class="size-s" onClick={onRename}>
              Save
            </button>
          </div>
        )}
        {isActive && (
          <span class="success">Active</span>
        )}
        <div class="grow-1" />
        {!isActive && (
          <button class="secondary size-s" onClick={makeActive}>
            Set Active
          </button>
        )}
        <button class="secondary size-s" onClick={onRenameStart}>
          Rename
        </button>
        <button class="error secondary size-s" onClick={onDeleteStart}>
          Delete
        </button>
      </div>
      {deleting && (
        <div class="alert error">
          <div class="row">
            <p>Are you sure to delete?</p>
            <button class="size-s" onClick={onDelete}>
              Delete
            </button>
            <button class="secondary size-s" onClick={onDeleteCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {backend.type == "blockfrost" && (
        <div class="column" style={{ gap: "0.25rem" }}>
          <label>
            Provider
            <input readonly value="Blockfrost" />
          </label>
          <div />
          <label>
            Project ID
            <input readonly value={backend.projectId} />
          </label>
        </div>
      )}
      {backend.type == "ogmios_kupo" && (
        <div class="column" style={{ gap: "0.25rem" }}>
          <label>
            Provider
            <input readonly value="Ogmios/Kupo" />
          </label>
          <div />
          <label>
            Ogmios URL
            <input readonly value={backend.ogmiosUrl} />
          </label>
          <label>
            Kupo URL
            <input readonly value={backend.kupoUrl} />
          </label>
        </div>
      )}
      <div />
    </div>
  );
}

interface BackendAddFormProps {
  onClose: () => void;
}
function BackendAddForm({ onClose }: BackendAddFormProps) {
  let [type, setType] = useState("blockfrost");

  let [name, setName] = useState("");
  let [projectId, setProjectId] = useState("");
  let [ogmiosUrl, setOgmiosUrl] = useState("");
  let [kupoUrl, setKupoUrl] = useState("");

  const onSubmit = async () => {
    let backendDef: State.BackendDef;
    if (type == "blockfrost") {
      backendDef = {
        type: "blockfrost",
        name,
        projectId,
      };
    } else if (type == "ogmios_kupo") {
      backendDef = {
        type: "ogmios_kupo",
        name,
        ogmiosUrl,
        kupoUrl,
      };
    } else {
      throw Error("Unreachable; invalid backend type");
    }

    await State.backendsAdd(backendDef);
    onClose();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
        alignItems: "stretch",
      }}
      class="surface pad-s"
    >
      <label>
        Name:
        <input
          type="text"
          value={name}
          onInput={(ev) => setName(ev.currentTarget.value)}
        />
      </label>
      <label>
        Provider
        <select value={type} onInput={(ev) => setType(ev.currentTarget.value)}>
          <option value="blockfrost">BlockFrost</option>
          <option value="ogmios_kupo">Ogmios/Kupo</option>
        </select>
      </label>

      {type == "blockfrost" && (
        <>
          <label>
            Project ID
            <input
              value={projectId}
              onInput={(ev) => setProjectId(ev.currentTarget.value)}
            />
          </label>
        </>
      )}
      {type == "ogmios_kupo" && (
        <>
          <label>
            Ogmios URL
            <input
              value={ogmiosUrl}
              onInput={(ev) => setOgmiosUrl(ev.currentTarget.value)}
            />
          </label>
          <label>
            Kupo URL
            <input
              value={kupoUrl}
              onInput={(ev) => setKupoUrl(ev.currentTarget.value)}
            />
          </label>
        </>
      )}
      <div />
      <div class="row">
        <button onClick={onSubmit}>Save</button>
        <button class="secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

interface AccountCardProps {
  accountId: string;
  accountDef: State.AccountDef;
}

function AccountCard({ accountId, accountDef }: AccountCardProps) {
  let accountIdx = accountDef.accountIdx;

  let [renaming, setRenaming] = useState(false);
  let [name, setName] = useState(accountDef.name || "Unnamed");
  let [deleting, setDeleting] = useState(false);

  const onRenameStart = () => setRenaming(true);
  const onRename = async () => {
    await State.accountsRename(accountId, name);
    setRenaming(false);
  };

  const onDeleteStart = () => setDeleting(true);
  const onDeleteCancel = () => setDeleting(false);
  const onDelete = async () => {
    await State.accountsDelete(accountId);
    setRenaming(false);
  };

  let derivation = `m(1852'/1815'/${accountIdx}')`;
  let pubkey = accountDef.account.baseAddress.to_address().to_bech32();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
        alignItems: "stretch",
      }}
      class="alert pad-s"
    >
      <div class="row">
        {!renaming ? (
          <div class="h3">{name}</div>
        ) : (
          <div class="row">
            <input
              value={name}
              onInput={(ev) => setName(ev.currentTarget.value)}
            />
            <button class="size-s" onClick={onRename}>
              Save
            </button>
          </div>
        )}
        <div>{derivation}</div>
        <div class="grow-1" />
        <button class="secondary size-s" onClick={onRenameStart}>
          Rename
        </button>
        <button class="error secondary size-s" onClick={onDeleteStart}>
          Delete
        </button>
      </div>
      {deleting && (
        <div class="alert error">
          <div class="row">
            <p>Are you sure to delete?</p>
            <button class="size-s" onClick={onDelete}>
              Delete
            </button>
            <button class="secondary size-s" onClick={onDeleteCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <div>{pubkey}</div>
    </div>
  );
}

interface AccountAddFormProps {
  walletId: string;
  onClose: () => void;
}
function AccountAddForm({ walletId, onClose }: AccountAddFormProps) {
  let [name, setName] = useState("");
  let [accountIdx, setAccountIdx] = useState(0);

  const onSubmit = async () => {
    await State.accountsAdd({ name, walletId, accountIdx });
    onClose();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "0.5em",
        alignItems: "end",
      }}
      class="surface pad-s"
    >
      <label>
        Name:
        <input
          type="text"
          value={name}
          onInput={(ev) => setName(ev.currentTarget.value)}
        />
      </label>
      <label>
        Account Index
        <input
          type="text"
          value={accountIdx}
          onInput={(ev) => setAccountIdx(parseInt(ev.currentTarget.value))}
        />
      </label>
      <div />
      <div class="row">
        <button onClick={onSubmit}>Save</button>
        <button class="secondary" onClick={() => onClose()}>
          Cancel
        </button>
      </div>
    </div>
  );
}
