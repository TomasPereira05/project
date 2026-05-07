import { useEffect, useState, type ReactNode } from "react";
import { GripVertical, ShieldAlert } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import {
  createEquipmentPlacement,
  createOtherSport,
  createPubOption,
  createTeamCategory,
  deactivateEquipmentPlacement,
  deactivateOtherSport,
  deactivatePubOption,
  deactivateTeamCategory,
  fetchCatalogSnapshot,
  reorderEquipmentPlacements,
  reorderOtherSports,
  reorderPubOptions,
  reorderTeamCategories,
  updateEquipmentPlacement,
  updateOtherSport,
  updatePubOption,
  updateTeamCategory,
  upsertOtherSportPrice,
  upsertPubOptionPrice,
  upsertTeamCategoryPriceOverride,
  upsertTeamGroupSponsorshipPrice,
} from "..";
import type { CatalogSnapshot, EquipmentPlacement, OtherSport, PubOption, TeamCategory, TeamGroup } from "..";
import { compareBySortOrder, moveItem } from "..";
import { useAuth } from "../../../shared/hooks/useAuth";
import { euroInputFromCents } from "../../../shared/utils";

type CatalogEditor = { code: string; label: string; teamGroupId?: string };
type CatalogKind = "pub" | "team" | "placement" | "sport";
type CatalogItem = PubOption | TeamCategory | EquipmentPlacement | OtherSport;

export default function SponsorSettings() {
  const { role } = useAuth();
  const canManage = role === "ADMIN" || role === "SECRETARIA";
  const [catalogs, setCatalogs] = useState<CatalogSnapshot>({
    pubOptions: [],
    teamGroups: [],
    teamCategories: [],
    equipmentPlacements: [],
    otherSports: [],
    pubOptionPrices: [],
    teamGroupPrices: [],
    teamCategoryPriceOverrides: [],
    otherSportPrices: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [catalogDrafts, setCatalogDrafts] = useState<Record<CatalogKind, CatalogEditor>>({
    pub: { code: "", label: "" },
    team: { code: "", label: "" },
    placement: { code: "", label: "" },
    sport: { code: "", label: "" },
  });
  const [pubPriceDrafts, setPubPriceDrafts] = useState<Record<number, string>>({});
  const [teamPriceDrafts, setTeamPriceDrafts] = useState<Record<string, string>>({});
  const [teamOverrideDrafts, setTeamOverrideDrafts] = useState<Record<string, string>>({});
  const [selectedOverrideTeamId, setSelectedOverrideTeamId] = useState("");
  const [otherSportPriceDrafts, setOtherSportPriceDrafts] = useState<Record<number, string>>({});
  const [dragState, setDragState] = useState<{ kind: CatalogKind; index: number } | null>(null);

  useEffect(() => {
    if (!canManage) return;
    void refreshCatalogs();
  }, [canManage]);

  useEffect(() => {
    setPubPriceDrafts(Object.fromEntries(catalogs.pubOptionPrices.map((item) => [item.pubOptionId, euroInputFromCents(item.price)])));
    setOtherSportPriceDrafts(Object.fromEntries(catalogs.otherSportPrices.map((item) => [item.sportId, euroInputFromCents(item.price)])));
    setTeamPriceDrafts(
      Object.fromEntries(catalogs.teamGroupPrices.map((item) => [`${item.teamGroupId}-${item.placementId}`, euroInputFromCents(item.price)])),
    );
    setTeamOverrideDrafts(
      Object.fromEntries(
        catalogs.teamCategoryPriceOverrides.map((item) => [
          `${item.teamCategoryId}-${item.placementId}`,
          euroInputFromCents(item.price),
        ]),
      ),
    );
  }, [catalogs]);

  if (!role) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!canManage) {
    return <Navigate to="/sponsors" replace />;
  }

  async function refreshCatalogs() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetchCatalogSnapshot();
      setCatalogs({
          ...response,
          pubOptions: [...response.pubOptions].sort(compareBySortOrder),
          teamGroups: [...response.teamGroups].sort(compareBySortOrder),
          teamCategories: [...response.teamCategories].sort(compareBySortOrder),
          equipmentPlacements: [...response.equipmentPlacements].sort(compareBySortOrder),
          otherSports: [...response.otherSports].sort(compareBySortOrder),
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar a configuracao.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateCatalog(kind: CatalogKind) {
    const draft = catalogDrafts[kind];
    if (!draft.code.trim() || !draft.label.trim()) {
      setErrorMessage("Code e label sao obrigatorios.");
      return;
    }
    setErrorMessage("");
    setNotice("");
    try {
      if (kind === "pub") await createPubOption({ ...draft, sortOrder: catalogs.pubOptions.length });
      else if (kind === "team") {
        const teamGroupId = Number.parseInt(draft.teamGroupId ?? "", 10);
        if (Number.isNaN(teamGroupId)) {
          setErrorMessage("Escolhe o grupo da equipa.");
          return;
        }
        await createTeamCategory({ ...draft, teamGroupId, sortOrder: catalogs.teamCategories.length });
      }
      else if (kind === "placement") await createEquipmentPlacement({ ...draft, sortOrder: catalogs.equipmentPlacements.length });
      else await createOtherSport({ ...draft, sortOrder: catalogs.otherSports.length });
      setCatalogDrafts((current) => ({ ...current, [kind]: { code: "", label: "" } }));
      setNotice("Opcao criada com sucesso.");
      await refreshCatalogs();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel criar a opcao.");
    }
  }

  async function handleSaveCatalogItem(kind: CatalogKind, item: CatalogItem) {
    setErrorMessage("");
    setNotice("");
    try {
      if (kind === "pub") await updatePubOption((item as PubOption).pubId, item as PubOption);
      else if (kind === "team") await updateTeamCategory((item as TeamCategory).teamId, item as TeamCategory);
      else if (kind === "placement") await updateEquipmentPlacement((item as EquipmentPlacement).equipmentId, item as EquipmentPlacement);
      else await updateOtherSport((item as OtherSport).sportId, item as OtherSport);
      setNotice("Opcao atualizada.");
      await refreshCatalogs();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar a opcao.");
    }
  }

  async function handleDeactivateCatalogItem(kind: CatalogKind, id: number) {
    setErrorMessage("");
    setNotice("");
    try {
      if (kind === "pub") await deactivatePubOption(id);
      else if (kind === "team") await deactivateTeamCategory(id);
      else if (kind === "placement") await deactivateEquipmentPlacement(id);
      else await deactivateOtherSport(id);
      setNotice("Opcao desativada.");
      await refreshCatalogs();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel desativar a opcao.");
    }
  }

  async function handleCatalogDrop(kind: CatalogKind, targetIndex: number) {
    if (!dragState || dragState.kind !== kind) return;
    try {
      if (kind === "pub") await reorderPubOptions(moveItem(catalogs.pubOptions, dragState.index, targetIndex).map((item) => item.pubId));
      else if (kind === "team") await reorderTeamCategories(moveItem(catalogs.teamCategories, dragState.index, targetIndex).map((item) => item.teamId));
      else if (kind === "placement") await reorderEquipmentPlacements(moveItem(catalogs.equipmentPlacements, dragState.index, targetIndex).map((item) => item.equipmentId));
      else await reorderOtherSports(moveItem(catalogs.otherSports, dragState.index, targetIndex).map((item) => item.sportId));
      setNotice("Ordem atualizada.");
      await refreshCatalogs();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel reordenar.");
    } finally {
      setDragState(null);
    }
  }

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">Settings</p>
            <h1 className="sponsor-panel-title">Opcoes e precos de patrocinio</h1>
            <p className="sponsor-muted-text">Adicionar, editar, desativar e reordenar opcoes disponiveis.</p>
          </div>
          <Link className="sponsor-button-secondary" to="/sponsors/approvals">
            Ver aprovacoes
          </Link>
        </section>

        {errorMessage ? (
          <div className="sponsor-feedback sponsor-feedback-error">
            <ShieldAlert size={18} />
            <span>{errorMessage}</span>
          </div>
        ) : null}
        {notice ? <div className="sponsor-feedback sponsor-feedback-success">{notice}</div> : null}

        {isLoading ? (
          <section className="sponsor-panel"><div className="sponsor-empty-card">A carregar configuracao...</div></section>
        ) : (
          <>
            <section className="sponsor-panel">
              <div className="sponsor-panel-header">
                <div>
                  <p className="sponsor-section-eyebrow">Catalogo</p>
                  <h2 className="sponsor-panel-title">Opcoes disponiveis</h2>
                </div>
              </div>
              <div className="sponsor-catalog-grid">
                <SettingsCatalogSection title="Pub options" subtitle="Publicidade." items={catalogs.pubOptions} kind="pub" draft={catalogDrafts.pub} onDraftChange={(value) => setCatalogDrafts((current) => ({ ...current, pub: value }))} onCreate={() => void handleCreateCatalog("pub")} onSave={(item) => void handleSaveCatalogItem("pub", item)} onDeactivate={(id) => void handleDeactivateCatalogItem("pub", id)} onDragStart={(index) => setDragState({ kind: "pub", index })} onDrop={(index) => void handleCatalogDrop("pub", index)} renderExtra={(item) => <InlinePriceEditor value={pubPriceDrafts[item.pubId] ?? ""} onChange={(value) => setPubPriceDrafts((current) => ({ ...current, [item.pubId]: value }))} onSave={() => void (async () => { await upsertPubOptionPrice(item.pubId, pubPriceDrafts[item.pubId] ?? ""); setNotice("Preco atualizado."); await refreshCatalogs(); })()} />} />
                <SettingsCatalogSection title="Team categories" subtitle="Equipas." items={catalogs.teamCategories} kind="team" draft={catalogDrafts.team} teamGroups={catalogs.teamGroups} onDraftChange={(value) => setCatalogDrafts((current) => ({ ...current, team: value }))} onCreate={() => void handleCreateCatalog("team")} onSave={(item) => void handleSaveCatalogItem("team", item)} onDeactivate={(id) => void handleDeactivateCatalogItem("team", id)} onDragStart={(index) => setDragState({ kind: "team", index })} onDrop={(index) => void handleCatalogDrop("team", index)} renderExtra={(item) => <span className="sponsor-muted-text">{catalogs.teamGroups.find((group) => group.teamGroupId === item.teamGroupId)?.label ?? "Sem grupo"}</span>} />
                <SettingsCatalogSection title="Equipment placements" subtitle="Localizacoes." items={catalogs.equipmentPlacements} kind="placement" draft={catalogDrafts.placement} onDraftChange={(value) => setCatalogDrafts((current) => ({ ...current, placement: value }))} onCreate={() => void handleCreateCatalog("placement")} onSave={(item) => void handleSaveCatalogItem("placement", item)} onDeactivate={(id) => void handleDeactivateCatalogItem("placement", id)} onDragStart={(index) => setDragState({ kind: "placement", index })} onDrop={(index) => void handleCatalogDrop("placement", index)} />
                <SettingsCatalogSection title="Other sports" subtitle="Outras modalidades." items={catalogs.otherSports} kind="sport" draft={catalogDrafts.sport} onDraftChange={(value) => setCatalogDrafts((current) => ({ ...current, sport: value }))} onCreate={() => void handleCreateCatalog("sport")} onSave={(item) => void handleSaveCatalogItem("sport", item)} onDeactivate={(id) => void handleDeactivateCatalogItem("sport", id)} onDragStart={(index) => setDragState({ kind: "sport", index })} onDrop={(index) => void handleCatalogDrop("sport", index)} renderExtra={(item) => <InlinePriceEditor value={otherSportPriceDrafts[item.sportId] ?? ""} onChange={(value) => setOtherSportPriceDrafts((current) => ({ ...current, [item.sportId]: value }))} onSave={() => void (async () => { await upsertOtherSportPrice(item.sportId, otherSportPriceDrafts[item.sportId] ?? ""); setNotice("Preco atualizado."); await refreshCatalogs(); })()} />} />
              </div>
            </section>

            <section className="sponsor-panel">
              <div className="sponsor-panel-header">
                <div>
                  <p className="sponsor-section-eyebrow">Tabela cruzada</p>
                  <h2 className="sponsor-panel-title">Precos de equipa</h2>
                </div>
              </div>
              <div className="sponsor-price-grid">
                {catalogs.teamGroups.flatMap((group) =>
                  catalogs.equipmentPlacements.map((placement) => {
                    const key = `${group.teamGroupId}-${placement.equipmentId}`;
                    return (
                      <div className="sponsor-price-card" key={key}>
                        <div>
                          <strong>{group.label}</strong>
                          <p>{placement.label}</p>
                        </div>
                        <InlinePriceEditor
                          value={teamPriceDrafts[key] ?? ""}
                          onChange={(value) => setTeamPriceDrafts((current) => ({ ...current, [key]: value }))}
                          onSave={() => void (async () => { await upsertTeamGroupSponsorshipPrice(group.teamGroupId, placement.equipmentId, teamPriceDrafts[key] ?? ""); setNotice("Preco atualizado."); await refreshCatalogs(); })()}
                        />
                      </div>
                    );
                  }),
                )}
              </div>
            </section>

            <section className="sponsor-panel">
              <div className="sponsor-panel-header">
                <div>
                  <p className="sponsor-section-eyebrow">Overrides</p>
                  <h2 className="sponsor-panel-title">Preco de equipa especifica</h2>
                  <p className="sponsor-muted-text">Escolhe uma equipa para criar ou atualizar um preco que fica acima do preco do grupo.</p>
                </div>
              </div>
              <label className="sponsor-field">
                <span>Equipa</span>
                <select className="sponsor-input" value={selectedOverrideTeamId} onChange={(event) => setSelectedOverrideTeamId(event.target.value)}>
                  <option value="">Selecionar equipa</option>
                  {catalogs.teamCategories.map((team) => (
                    <option key={team.teamId} value={team.teamId}>
                      {team.label}
                    </option>
                  ))}
                </select>
              </label>
              {selectedOverrideTeamId ? (
                <div className="sponsor-price-grid">
                  {catalogs.equipmentPlacements.map((placement) => {
                    const teamId = Number.parseInt(selectedOverrideTeamId, 10);
                    const key = `${teamId}-${placement.equipmentId}`;
                    return (
                      <div className="sponsor-price-card" key={key}>
                        <div>
                          <strong>{catalogs.teamCategories.find((team) => team.teamId === teamId)?.label}</strong>
                          <p>{placement.label}</p>
                        </div>
                        <InlinePriceEditor
                          value={teamOverrideDrafts[key] ?? ""}
                          onChange={(value) => setTeamOverrideDrafts((current) => ({ ...current, [key]: value }))}
                          onSave={() => void (async () => { await upsertTeamCategoryPriceOverride(teamId, placement.equipmentId, teamOverrideDrafts[key] ?? ""); setNotice("Override atualizado."); await refreshCatalogs(); })()}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

type SettingsCatalogSectionProps<T extends CatalogItem> = {
  title: string;
  subtitle: string;
  items: T[];
  kind: CatalogKind;
  draft: CatalogEditor;
  teamGroups?: TeamGroup[];
  onDraftChange: (value: CatalogEditor) => void;
  onCreate: () => void;
  onSave: (item: T) => void;
  onDeactivate: (id: number) => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
  renderExtra?: (item: T) => ReactNode;
};

function SettingsCatalogSection<T extends CatalogItem>({ title, subtitle, items, kind, draft, teamGroups = [], onDraftChange, onCreate, onSave, onDeactivate, onDragStart, onDrop, renderExtra }: SettingsCatalogSectionProps<T>) {
  return (
    <article className="sponsor-catalog-section">
      <div className="sponsor-catalog-headline">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="sponsor-inline-form">
        <input className="sponsor-input" placeholder="Code" value={draft.code} onChange={(event) => onDraftChange({ ...draft, code: event.target.value })} />
        <input className="sponsor-input" placeholder="Label" value={draft.label} onChange={(event) => onDraftChange({ ...draft, label: event.target.value })} />
        {kind === "team" ? (
          <select className="sponsor-input" value={draft.teamGroupId ?? ""} onChange={(event) => onDraftChange({ ...draft, teamGroupId: event.target.value })}>
            <option value="">Grupo</option>
            {teamGroups.map((group) => (
              <option key={group.teamGroupId} value={group.teamGroupId}>
                {group.label}
              </option>
            ))}
          </select>
        ) : null}
        <button className="sponsor-button-primary" onClick={onCreate} type="button">Add</button>
      </div>
      <div className="sponsor-catalog-list">
        {items.map((item, index) => (
          <SettingsCatalogRow item={item} kind={kind} key={getCatalogItemId(kind, item)} onSave={onSave} onDeactivate={onDeactivate} onDragStart={() => onDragStart(index)} onDrop={() => onDrop(index)} renderExtra={renderExtra} />
        ))}
      </div>
    </article>
  );
}

function SettingsCatalogRow<T extends CatalogItem>({ item, kind, onSave, onDeactivate, onDragStart, onDrop, renderExtra }: { item: T; kind: CatalogKind; onSave: (item: T) => void; onDeactivate: (id: number) => void; onDragStart: () => void; onDrop: () => void; renderExtra?: (item: T) => ReactNode; }) {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(item.code);
  const [label, setLabel] = useState(item.label);
  useEffect(() => { setCode(item.code); setLabel(item.label); }, [item.code, item.label]);
  return (
    <div className="sponsor-catalog-row" draggable onDragStart={onDragStart} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
      <div className="sponsor-catalog-reorder"><GripVertical size={16} /></div>
      <div className="sponsor-catalog-fields">
        <input className="sponsor-input" disabled={!isEditing} value={code} onChange={(event) => setCode(event.target.value)} />
        <input className="sponsor-input" disabled={!isEditing} value={label} onChange={(event) => setLabel(event.target.value)} />
      </div>
      <div className="sponsor-catalog-actions">
        {renderExtra ? renderExtra(item) : null}
        <button className="sponsor-button-secondary" onClick={() => { if (isEditing) { setCode(item.code); setLabel(item.label); } setIsEditing((current) => !current); }} type="button">{isEditing ? "Cancel" : "Edit"}</button>
        {isEditing ? <button className="sponsor-button-primary" onClick={() => { onSave({ ...item, code, label } as T); setIsEditing(false); }} type="button">Save</button> : null}
        <button className="sponsor-button-ghost" onClick={() => onDeactivate(getCatalogItemId(kind, item))} type="button">Deactivate</button>
      </div>
    </div>
  );
}

function InlinePriceEditor({ value, onChange, onSave }: { value: string; onChange: (value: string) => void; onSave: () => void; }) {
  return (
    <div className="sponsor-price-editor">
      <input className="sponsor-input sponsor-input-price" inputMode="decimal" placeholder="0.00" value={value} onChange={(event) => onChange(event.target.value)} />
      <button className="sponsor-button-secondary" onClick={onSave} type="button">Save</button>
    </div>
  );
}

function getCatalogItemId(kind: CatalogKind, item: CatalogItem) {
  if (kind === "pub") return (item as PubOption).pubId;
  if (kind === "team") return (item as TeamCategory).teamId;
  if (kind === "placement") return (item as EquipmentPlacement).equipmentId;
  return (item as OtherSport).sportId;
}
