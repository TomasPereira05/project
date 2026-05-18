import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import {
  upsertTeamCategoryPriceOverride,
  upsertTeamGroupSponsorshipPrice,
} from "..";
import type { EquipmentPlacement, OtherSport, PubOption } from "..";
import LabeledField from "../../../shared/components/LabeledField";
import { useSponsorCatalogs, useSponsorSettingsActions } from "../hooks";
import { isValidPubCapacity, parseCatalogCount, type CatalogEditor, type CatalogKind } from "../utils";
import { centsFromEuroInput, euroInputFromCents } from "../../../shared/utils";

type CatalogItem = PubOption | EquipmentPlacement | OtherSport;

export default function SponsorSettings() {
  const { t } = useTranslation();
  const { catalogs, errorMessage: catalogErrorMessage, isLoading, refreshCatalogs } = useSponsorCatalogs({
    errorMessage: t("sponsors.settings.errors.load"),
  });
  const {
    actionErrorMessage,
    catalogDrafts,
    handleCatalogDrop,
    handleCreateCatalog,
    handleDeactivateCatalogItem,
    handleSaveCatalogItem,
    notice,
    selectedOverrideTeamId,
    setCatalogDrafts,
    setDragState,
    setNotice,
    setSelectedOverrideTeamId,
    setTeamOverrideDrafts,
    setTeamPriceDrafts,
    teamOverrideDrafts,
    teamPriceDrafts,
  } = useSponsorSettingsActions({ catalogs, refreshCatalogs });
  const displayErrorMessage = actionErrorMessage || catalogErrorMessage;

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">{t("sponsors.settings.eyebrow")}</p>
            <h1 className="sponsor-panel-title">{t("sponsors.settings.title")}</h1>
            <p className="sponsor-muted-text">{t("sponsors.settings.description")}</p>
          </div>
          <Link className="sponsor-button-secondary" to="/sponsors/approvals">
            {t("sponsors.settings.approvalsLink")}
          </Link>
        </section>

        {displayErrorMessage ? (
          <div className="sponsor-feedback sponsor-feedback-error">
            <ShieldAlert size={18} />
            <span>{displayErrorMessage}</span>
          </div>
        ) : null}
        {notice ? <div className="sponsor-feedback sponsor-feedback-success">{notice}</div> : null}

        {isLoading ? (
          <section className="sponsor-panel"><div className="sponsor-empty-card">{t("sponsors.settings.loading")}</div></section>
        ) : (
          <>
            <section className="sponsor-panel">
              <div className="sponsor-panel-header">
                <div>
                  <p className="sponsor-section-eyebrow">{t("sponsors.settings.catalogEyebrow")}</p>
                  <h2 className="sponsor-panel-title">{t("sponsors.settings.catalogTitle")}</h2>
                </div>
              </div>
              <div className="sponsor-catalog-grid">
                <SettingsCatalogSection t={t} title={t("sponsors.settings.sections.pub.title")} subtitle={t("sponsors.settings.sections.pub.subtitle")} items={catalogs.pubOptions} kind="pub" draft={catalogDrafts.pub} onDraftChange={(value) => setCatalogDrafts((current) => ({ ...current, pub: value }))} onCreate={() => void handleCreateCatalog("pub")} onSave={(item) => void handleSaveCatalogItem("pub", item)} onDeactivate={(id) => void handleDeactivateCatalogItem("pub", id)} onDragStart={(index) => setDragState({ kind: "pub", index })} onDrop={(index) => void handleCatalogDrop("pub", index)} />
                <SettingsCatalogSection t={t} title={t("sponsors.settings.sections.placement.title")} subtitle={t("sponsors.settings.sections.placement.subtitle")} items={catalogs.equipmentPlacements} kind="placement" draft={catalogDrafts.placement} onDraftChange={(value) => setCatalogDrafts((current) => ({ ...current, placement: value }))} onCreate={() => void handleCreateCatalog("placement")} onSave={(item) => void handleSaveCatalogItem("placement", item)} onDeactivate={(id) => void handleDeactivateCatalogItem("placement", id)} onDragStart={(index) => setDragState({ kind: "placement", index })} onDrop={(index) => void handleCatalogDrop("placement", index)} />
                <SettingsCatalogSection t={t} title={t("sponsors.settings.sections.sport.title")} subtitle={t("sponsors.settings.sections.sport.subtitle")} items={catalogs.otherSports} kind="sport" draft={catalogDrafts.sport} onDraftChange={(value) => setCatalogDrafts((current) => ({ ...current, sport: value }))} onCreate={() => void handleCreateCatalog("sport")} onSave={(item) => void handleSaveCatalogItem("sport", item)} onDeactivate={(id) => void handleDeactivateCatalogItem("sport", id)} onDragStart={(index) => setDragState({ kind: "sport", index })} onDrop={(index) => void handleCatalogDrop("sport", index)} />
              </div>
            </section>

            <section className="sponsor-panel">
              <div className="sponsor-panel-header">
                <div>
                  <p className="sponsor-section-eyebrow">{t("sponsors.settings.teamPricesEyebrow")}</p>
                  <h2 className="sponsor-panel-title">{t("sponsors.settings.teamPricesTitle")}</h2>
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
                          label={t("sponsors.fields.price")}
                          onSave={(value) => void (async () => { await upsertTeamGroupSponsorshipPrice(group.teamGroupId, placement.equipmentId, value); setNotice(t("sponsors.settings.notices.priceUpdated")); await refreshCatalogs(); })()}
                          t={t}
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
                  <p className="sponsor-section-eyebrow">{t("sponsors.settings.overridesEyebrow")}</p>
                  <h2 className="sponsor-panel-title">{t("sponsors.settings.overridesTitle")}</h2>
                  <p className="sponsor-muted-text">{t("sponsors.settings.overridesDescription")}</p>
                </div>
              </div>
              <label className="sponsor-field">
                <span>{t("sponsors.fields.team")}</span>
                <select className="sponsor-input" value={selectedOverrideTeamId} onChange={(event) => setSelectedOverrideTeamId(event.target.value)}>
                  <option value="">{t("sponsors.settings.selectTeam")}</option>
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
                          label={t("sponsors.fields.price")}
                          onSave={(value) => void (async () => { await upsertTeamCategoryPriceOverride(teamId, placement.equipmentId, value); setNotice(t("sponsors.settings.notices.overrideUpdated")); await refreshCatalogs(); })()}
                          t={t}
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
  t: (key: string, options?: Record<string, unknown>) => string;
  title: string;
  subtitle: string;
  items: T[];
  kind: CatalogKind;
  draft: CatalogEditor;
  onDraftChange: (value: CatalogEditor) => void;
  onCreate: () => void;
  onSave: (item: T) => void;
  onDeactivate: (id: number) => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
  renderExtra?: (item: T) => ReactNode;
};

function SettingsCatalogSection<T extends CatalogItem>({ t, title, subtitle, items, kind, draft, onDraftChange, onCreate, onSave, onDeactivate, onDragStart, onDrop, renderExtra }: SettingsCatalogSectionProps<T>) {
  return (
    <article className="sponsor-catalog-section">
      <div className="sponsor-catalog-headline">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="sponsor-inline-form">
        <LabeledField label={t("sponsors.fields.code")} tooltip={t("config.codeTooltip")}>
          <input className="sponsor-input" value={draft.code} onChange={(event) => onDraftChange({ ...draft, code: event.target.value })} />
        </LabeledField>
        <LabeledField label={t("sponsors.fields.label")} tooltip={t("config.labelTooltip")}>
          <input className="sponsor-input" value={draft.label} onChange={(event) => onDraftChange({ ...draft, label: event.target.value })} />
        </LabeledField>
        {kind === "pub" ? (
          <>
            <LabeledField label={t("sponsors.fields.price")}>
              <input className="sponsor-input" inputMode="decimal" value={draft.price ?? "0.00"} onChange={(event) => onDraftChange({ ...draft, price: event.target.value })} />
            </LabeledField>
            <LabeledField label={t("sponsors.fields.available")}>
              <input className="sponsor-input" inputMode="numeric" value={draft.available ?? "0"} onChange={(event) => onDraftChange({ ...draft, available: event.target.value })} />
            </LabeledField>
          </>
        ) : null}
        {kind === "sport" ? (
          <LabeledField label={t("sponsors.fields.price")}>
            <input className="sponsor-input" inputMode="decimal" value={draft.price ?? "0.00"} onChange={(event) => onDraftChange({ ...draft, price: event.target.value })} />
          </LabeledField>
        ) : null}
        <button className="sponsor-button-primary sponsor-form-action" onClick={onCreate} type="button">{t("sponsors.settings.actions.add")}</button>
      </div>
      <div className="sponsor-catalog-list">
        {items.map((item, index) => (
          <SettingsCatalogRow t={t} item={item} kind={kind} key={getCatalogItemId(kind, item)} onSave={onSave} onDeactivate={onDeactivate} onDragStart={() => onDragStart(index)} onDrop={() => onDrop(index)} renderExtra={renderExtra} />
        ))}
      </div>
    </article>
  );
}

function SettingsCatalogRow<T extends CatalogItem>({ t, item, kind, onSave, onDeactivate, onDragStart, onDrop, renderExtra }: { t: (key: string, options?: Record<string, unknown>) => string; item: T; kind: CatalogKind; onSave: (item: T) => void; onDeactivate: (id: number) => void; onDragStart: () => void; onDrop: () => void; renderExtra?: (item: T) => ReactNode; }) {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(item.code);
  const [label, setLabel] = useState(item.label);
  const pubItem = kind === "pub" ? item as PubOption : null;
  const pricedItem = kind === "pub" || kind === "sport" ? item as PubOption | OtherSport : null;
  const [available, setAvailable] = useState(String(pubItem?.available ?? 0));
  const [price, setPrice] = useState(euroInputFromCents(pricedItem?.price ?? 0));
  useEffect(() => {
    setCode(item.code);
    setLabel(item.label);
    setPrice(euroInputFromCents(pricedItem?.price ?? 0));
    if (pubItem) {
      setAvailable(String(pubItem.available));
    }
  }, [item.code, item.label, pricedItem?.price, pubItem?.available]);
  return (
    <div className="sponsor-catalog-row" draggable onDragStart={onDragStart} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
      <div className="sponsor-catalog-reorder"><GripVertical size={16} /></div>
      <div className="sponsor-catalog-fields">
        <LabeledField label={t("sponsors.fields.code")}>
          <input className="sponsor-input" disabled={!isEditing} value={code} onChange={(event) => setCode(event.target.value)} />
        </LabeledField>
        <LabeledField label={t("sponsors.fields.label")}>
          <input className="sponsor-input" disabled={!isEditing} value={label} onChange={(event) => setLabel(event.target.value)} />
        </LabeledField>
        {pricedItem ? (
          <LabeledField label={t("sponsors.fields.price")}>
            <input className="sponsor-input" disabled={!isEditing} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
          </LabeledField>
        ) : null}
        {pubItem ? (
          <>
            <LabeledField label={t("sponsors.fields.available")}>
              <input className="sponsor-input" disabled={!isEditing} inputMode="numeric" value={available} onChange={(event) => setAvailable(event.target.value)} />
            </LabeledField>
            <div className="sponsor-capacity-summary">
              <span>{t("sponsors.fields.free")}: {pubItem.free}</span>
              <span>{t("sponsors.fields.occupied")}: {pubItem.occupied}</span>
            </div>
          </>
        ) : null}
      </div>
      <div className="sponsor-catalog-actions">
        {renderExtra ? renderExtra(item) : null}
        <button className="sponsor-button-secondary" onClick={() => {
          if (isEditing) {
            setCode(item.code);
            setLabel(item.label);
            if (pubItem) {
              setAvailable(String(pubItem.available));
            }
            if (pricedItem) {
              setPrice(euroInputFromCents(pricedItem.price));
            }
          }
          setIsEditing((current) => !current);
        }} type="button">{isEditing ? t("sponsors.settings.actions.cancel") : t("sponsors.settings.actions.edit")}</button>
        {isEditing ? <button className="sponsor-button-primary" onClick={() => {
          if (pubItem) {
            const nextAvailable = parseCatalogCount(available);
            if (!isValidPubCapacity(nextAvailable)) return;
            onSave({ ...item, code, label, price: centsFromEuroInput(price), available: nextAvailable } as T);
          } else if (pricedItem) {
            onSave({ ...item, code, label, price: centsFromEuroInput(price) } as T);
          } else {
            onSave({ ...item, code, label } as T);
          }
          setIsEditing(false);
        }} type="button">{t("sponsors.settings.actions.save")}</button> : null}
        <button className="sponsor-button-ghost" onClick={() => onDeactivate(getCatalogItemId(kind, item))} type="button">{t("sponsors.settings.actions.deactivate")}</button>
      </div>
    </div>
  );
}

function InlinePriceEditor({ label, t, value, onChange, onSave }: { label: string; t: (key: string) => string; value: string; onChange: (value: string) => void; onSave: (value: string) => void; }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="sponsor-price-editor">
      <LabeledField label={label}>
        <input
          className="sponsor-input sponsor-input-price"
          disabled={!isEditing}
          inputMode="decimal"
          placeholder="0.00"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(event.target.value);
          }}
        />
      </LabeledField>
      <div className="sponsor-price-editor-actions">
        <button
          className="sponsor-button-secondary"
          onClick={() => {
            if (isEditing) {
              setDraft(value);
              onChange(value);
            }
            setIsEditing((current) => !current);
          }}
          type="button"
        >
          {isEditing ? t("sponsors.settings.actions.cancel") : t("sponsors.settings.actions.edit")}
        </button>
        {isEditing ? (
          <button
            className="sponsor-button-primary"
            onClick={() => {
              onSave(draft);
              setIsEditing(false);
            }}
            type="button"
          >
            {t("sponsors.settings.actions.save")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function getCatalogItemId(kind: CatalogKind, item: CatalogItem) {
  if (kind === "pub") return (item as PubOption).pubId;
  if (kind === "placement") return (item as EquipmentPlacement).equipmentId;
  return (item as OtherSport).sportId;
}
