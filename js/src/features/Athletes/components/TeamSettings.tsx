import { useEffect, useState, type ReactNode } from "react";
import { Eye, EyeOff, GripVertical, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import LabeledField from "../../../shared/components/LabeledField";
import type { TeamCatalogCategory, TeamGroup } from "../types";
import { useTeamSettings } from "../hooks";
import AthletePageBackground from "./AthletePageBackground";

export default function TeamSettings() {
  const { t } = useTranslation();
  const codeTooltip = t("config.codeTooltip");
  const labelTooltip = t("config.labelTooltip");
  const {
    categoryDraft,
    dragState,
    errorMessage,
    groupDraft,
    groups,
    handleCategoryDrop,
    handleCreateCategory,
    handleCreateGroup,
    handleGroupDrop,
    handleSaveCategory,
    handleSaveGroup,
    handleToggleCategory,
    handleToggleGroup,
    isLoading,
    notice,
    setCategoryDraft,
    setDragState,
    setGroupDraft,
    setShowInactive,
    showInactive,
    visibleCategories,
    visibleGroups,
  } = useTeamSettings();

  return (
    <main className="athlete-cfg-page">
      <AthletePageBackground />
      <div className="athlete-cfg-shell">
        <section className="athlete-cfg-page-header">
          <div>
            <p className="athlete-cfg-section-eyebrow">{t("athletes.teamSettings.eyebrow")}</p>
            <h1 className="athlete-cfg-panel-title">{t("athletes.teamSettings.title")}</h1>
            <p className="athlete-cfg-muted-text">{t("athletes.teamSettings.description")}</p>
          </div>
          <button
            className="athlete-cfg-button-secondary"
            onClick={() => setShowInactive((current) => !current)}
            type="button"
          >
            {showInactive ? <EyeOff size={16} /> : <Eye size={16} />}
            {showInactive ? t("athletes.teamSettings.showActive") : t("athletes.teamSettings.showInactive")}
          </button>
        </section>

        {errorMessage ? (
          <div className="athlete-cfg-feedback athlete-cfg-feedback-error">
            <ShieldAlert size={18} />
            <span>{errorMessage}</span>
          </div>
        ) : null}
        {notice ? <div className="athlete-cfg-feedback athlete-cfg-feedback-success">{notice}</div> : null}

        <section className="athlete-tcfg-management-grid">
          <SettingsPanel
            emptyMessage={t("athletes.teamSettings.emptyGroups")}
            isLoading={isLoading}
            loadingMessage={t("athletes.teamSettings.loadingGroups")}
            title={t("athletes.teamSettings.groups")}
            eyebrow={t("athletes.teamSettings.teamGroups")}
            form={
              <div className="athlete-cfg-inline-form athlete-tcfg-inline-form">
                <LabeledField label={t("athletes.teamSettings.code")} tooltip={codeTooltip}>
                  <input
                    className="athlete-cfg-input"
                    value={groupDraft.code}
                    onChange={(event) => setGroupDraft((current) => ({ ...current, code: event.target.value }))}
                  />
                </LabeledField>
                <LabeledField label={t("athletes.teamSettings.label")} tooltip={labelTooltip}>
                  <input
                    className="athlete-cfg-input"
                    value={groupDraft.label}
                    onChange={(event) => setGroupDraft((current) => ({ ...current, label: event.target.value }))}
                  />
                </LabeledField>
                <button className="athlete-cfg-button-primary" onClick={handleCreateGroup} type="button">
                  {t("athletes.teamSettings.actions.add")}
                </button>
              </div>
            }
          >
            {visibleGroups.map((group) => (
              <TeamGroupRow
                group={group}
                isDragging={dragState?.kind === "group" && dragState.id === group.teamGroupId}
                key={group.teamGroupId}
                onDragStart={() => setDragState({ kind: "group", id: group.teamGroupId })}
                onDrop={() => void handleGroupDrop(group.teamGroupId)}
                onSave={(nextGroup) => void handleSaveGroup(nextGroup)}
                onToggleActive={() => void handleToggleGroup(group)}
              />
            ))}
          </SettingsPanel>

          <SettingsPanel
            emptyMessage={t("athletes.teamSettings.emptyCategories")}
            isLoading={isLoading}
            loadingMessage={t("athletes.teamSettings.loadingCategories")}
            title={t("athletes.teamSettings.categoriesTitle")}
            eyebrow={t("athletes.teamSettings.categories")}
            form={
              <div className="athlete-cfg-inline-form athlete-tcfg-inline-form">
                <LabeledField label={t("athletes.teamSettings.code")} tooltip={codeTooltip}>
                  <input
                    className="athlete-cfg-input"
                    value={categoryDraft.code}
                    onChange={(event) => setCategoryDraft((current) => ({ ...current, code: event.target.value }))}
                  />
                </LabeledField>
                <LabeledField label={t("athletes.teamSettings.label")} tooltip={labelTooltip}>
                  <input
                    className="athlete-cfg-input"
                    value={categoryDraft.label}
                    onChange={(event) => setCategoryDraft((current) => ({ ...current, label: event.target.value }))}
                  />
                </LabeledField>
                <LabeledField label={t("athletes.teamSettings.group")}>
                  <select
                    className="athlete-cfg-input"
                    value={categoryDraft.teamGroupId}
                    onChange={(event) => setCategoryDraft((current) => ({ ...current, teamGroupId: event.target.value }))}
                  >
                    <option value="">{t("athletes.teamSettings.group")}</option>
                    {groups.map((group) => (
                      <option key={group.teamGroupId} value={group.teamGroupId}>
                        {group.label}
                        {group.active ? "" : t("athletes.teamSettings.inactiveSuffix")}
                      </option>
                    ))}
                  </select>
                </LabeledField>
                <button className="athlete-cfg-button-primary" onClick={handleCreateCategory} type="button">
                  {t("athletes.teamSettings.actions.add")}
                </button>
              </div>
            }
          >
            {visibleCategories.map((category) => (
              <TeamCategoryRow
                category={category}
                groups={groups}
                isDragging={dragState?.kind === "category" && dragState.id === category.teamId}
                key={category.teamId}
                onDragStart={() => setDragState({ kind: "category", id: category.teamId })}
                onDrop={() => void handleCategoryDrop(category.teamId)}
                onSave={(nextCategory) => void handleSaveCategory(nextCategory)}
                onToggleActive={() => void handleToggleCategory(category)}
              />
            ))}
          </SettingsPanel>
        </section>
      </div>
    </main>
  );
}

function SettingsPanel({
  children,
  emptyMessage,
  eyebrow,
  form,
  isLoading,
  loadingMessage,
  title,
}: {
  children: ReactNode[];
  emptyMessage: string;
  eyebrow: string;
  form: ReactNode;
  isLoading: boolean;
  loadingMessage: string;
  title: string;
}) {
  return (
    <section className="athlete-cfg-panel">
      <div className="athlete-cfg-panel-header">
        <div>
          <p className="athlete-cfg-section-eyebrow">{eyebrow}</p>
          <h2 className="athlete-cfg-panel-title">{title}</h2>
        </div>
      </div>

      {form}

      {isLoading ? (
        <div className="athlete-cfg-empty-card">{loadingMessage}</div>
      ) : children.length === 0 ? (
        <div className="athlete-cfg-empty-card">{emptyMessage}</div>
      ) : (
        <div className="athlete-cfg-catalog-list">{children}</div>
      )}
    </section>
  );
}

function TeamGroupRow({
  group,
  isDragging,
  onDragStart,
  onDrop,
  onSave,
  onToggleActive,
}: {
  group: TeamGroup;
  isDragging: boolean;
  onDragStart: () => void;
  onDrop: () => void;
  onSave: (group: TeamGroup) => void;
  onToggleActive: () => void;
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(group.code);
  const [label, setLabel] = useState(group.label);
  const codeTooltip = t("config.codeTooltip");
  const labelTooltip = t("config.labelTooltip");

  useEffect(() => {
    setCode(group.code);
    setLabel(group.label);
  }, [group]);

  function resetEdit() {
    setCode(group.code);
    setLabel(group.label);
  }

  return (
    <div
      className={`athlete-cfg-catalog-row athlete-tcfg-draggable-row ${group.active ? "" : "is-muted"} ${isDragging ? "is-dragging" : ""}`}
      draggable
      onDragOver={(event) => event.preventDefault()}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <div className="athlete-cfg-catalog-reorder" title={t("athletes.teamSettings.dragToReorder")}>
        <GripVertical size={16} />
      </div>
      <div className="athlete-cfg-catalog-fields athlete-tcfg-row-fields">
        <LabeledField label={t("athletes.teamSettings.code")} tooltip={codeTooltip}>
          <input className="athlete-cfg-input" disabled={!isEditing} value={code} onChange={(event) => setCode(event.target.value)} />
        </LabeledField>
        <LabeledField label={t("athletes.teamSettings.label")} tooltip={labelTooltip}>
          <input className="athlete-cfg-input" disabled={!isEditing} value={label} onChange={(event) => setLabel(event.target.value)} />
        </LabeledField>
      </div>
      <div className="athlete-cfg-catalog-actions">
        <button
          className="athlete-cfg-button-secondary"
          onClick={() => {
            if (isEditing) {
              resetEdit();
            }
            setIsEditing((current) => !current);
          }}
          type="button"
        >
          {isEditing ? t("athletes.teamSettings.actions.cancel") : t("athletes.teamSettings.actions.edit")}
        </button>
        {isEditing ? (
          <button
            className="athlete-cfg-button-primary"
            onClick={() => {
              onSave({ ...group, code, label });
              setIsEditing(false);
            }}
            type="button"
          >
            {t("athletes.teamSettings.actions.save")}
          </button>
        ) : null}
        <button className="athlete-cfg-button-ghost" onClick={onToggleActive} type="button">
          {group.active ? t("athletes.teamSettings.actions.deactivate") : t("athletes.teamSettings.actions.activate")}
        </button>
      </div>
    </div>
  );
}

function TeamCategoryRow({
  category,
  groups,
  isDragging,
  onDragStart,
  onDrop,
  onSave,
  onToggleActive,
}: {
  category: TeamCatalogCategory;
  groups: TeamGroup[];
  isDragging: boolean;
  onDragStart: () => void;
  onDrop: () => void;
  onSave: (category: TeamCatalogCategory) => void;
  onToggleActive: () => void;
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(category.code);
  const [label, setLabel] = useState(category.label);
  const [teamGroupId, setTeamGroupId] = useState(String(category.teamGroupId));
  const codeTooltip = t("config.codeTooltip");
  const labelTooltip = t("config.labelTooltip");

  useEffect(() => {
    setCode(category.code);
    setLabel(category.label);
    setTeamGroupId(String(category.teamGroupId));
  }, [category]);

  function resetEdit() {
    setCode(category.code);
    setLabel(category.label);
    setTeamGroupId(String(category.teamGroupId));
  }

  return (
    <div
      className={`athlete-cfg-catalog-row athlete-tcfg-draggable-row ${category.active ? "" : "is-muted"} ${isDragging ? "is-dragging" : ""}`}
      draggable
      onDragOver={(event) => event.preventDefault()}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <div className="athlete-cfg-catalog-reorder" title={t("athletes.teamSettings.dragToReorder")}>
        <GripVertical size={16} />
      </div>
      <div className="athlete-cfg-catalog-fields athlete-tcfg-row-fields">
        <LabeledField label={t("athletes.teamSettings.code")} tooltip={codeTooltip}>
          <input className="athlete-cfg-input" disabled={!isEditing} value={code} onChange={(event) => setCode(event.target.value)} />
        </LabeledField>
        <LabeledField label={t("athletes.teamSettings.label")} tooltip={labelTooltip}>
          <input className="athlete-cfg-input" disabled={!isEditing} value={label} onChange={(event) => setLabel(event.target.value)} />
        </LabeledField>
        <LabeledField label={t("athletes.teamSettings.group")}>
          <select className="athlete-cfg-input" disabled={!isEditing} value={teamGroupId} onChange={(event) => setTeamGroupId(event.target.value)}>
            {groups.map((group) => (
              <option key={group.teamGroupId} value={group.teamGroupId}>
                {group.label}
                {group.active ? "" : t("athletes.teamSettings.inactiveSuffix")}
              </option>
            ))}
          </select>
        </LabeledField>
      </div>
      <div className="athlete-cfg-catalog-actions">
        <button
          className="athlete-cfg-button-secondary"
          onClick={() => {
            if (isEditing) {
              resetEdit();
            }
            setIsEditing((current) => !current);
          }}
          type="button"
        >
          {isEditing ? t("athletes.teamSettings.actions.cancel") : t("athletes.teamSettings.actions.edit")}
        </button>
        {isEditing ? (
          <button
            className="athlete-cfg-button-primary"
            onClick={() => {
              const parsedGroupId = Number.parseInt(teamGroupId, 10);
              if (Number.isNaN(parsedGroupId)) {
                return;
              }
              onSave({ ...category, code, label, teamGroupId: parsedGroupId });
              setIsEditing(false);
            }}
            type="button"
          >
            {t("athletes.teamSettings.actions.save")}
          </button>
        ) : null}
        <button className="athlete-cfg-button-ghost" onClick={onToggleActive} type="button">
          {category.active ? t("athletes.teamSettings.actions.deactivate") : t("athletes.teamSettings.actions.activate")}
        </button>
      </div>
    </div>
  );
}
