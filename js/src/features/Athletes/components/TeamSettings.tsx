import { useEffect, useState, type ReactNode } from "react";
import { Eye, EyeOff, GripVertical, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import LabeledField from "../../../shared/components/LabeledField";
import type { TeamCatalogCategory, TeamGroup } from "../types";
import { useTeamSettings } from "../hooks";

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
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">Equipas</p>
            <h1 className="sponsor-panel-title">Settings de equipas</h1>
            <p className="sponsor-muted-text">Gere grupos, categorias, estado e ordem de apresentacao.</p>
          </div>
          <button
            className="sponsor-button-secondary"
            onClick={() => setShowInactive((current) => !current)}
            type="button"
          >
            {showInactive ? <EyeOff size={16} /> : <Eye size={16} />}
            {showInactive ? "Mostrar ativas" : "Mostrar inativas"}
          </button>
        </section>

        {errorMessage ? (
          <div className="sponsor-feedback sponsor-feedback-error">
            <ShieldAlert size={18} />
            <span>{errorMessage}</span>
          </div>
        ) : null}
        {notice ? <div className="sponsor-feedback sponsor-feedback-success">{notice}</div> : null}

        <section className="team-settings-management-grid">
          <SettingsPanel
            emptyMessage="Sem grupos para mostrar."
            isLoading={isLoading}
            loadingMessage="A carregar grupos..."
            title="Grupos"
            eyebrow="Team groups"
            form={
              <div className="sponsor-inline-form team-settings-inline-form">
                <LabeledField label="Code" tooltip={codeTooltip}>
                  <input
                    className="sponsor-input"
                    value={groupDraft.code}
                    onChange={(event) => setGroupDraft((current) => ({ ...current, code: event.target.value }))}
                  />
                </LabeledField>
                <LabeledField label="Label" tooltip={labelTooltip}>
                  <input
                    className="sponsor-input"
                    value={groupDraft.label}
                    onChange={(event) => setGroupDraft((current) => ({ ...current, label: event.target.value }))}
                  />
                </LabeledField>
                <button className="sponsor-button-primary" onClick={handleCreateGroup} type="button">
                  Add
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
            emptyMessage="Sem categorias para mostrar."
            isLoading={isLoading}
            loadingMessage="A carregar categorias..."
            title="Escaloes de equipa"
            eyebrow="Categorias"
            form={
              <div className="sponsor-inline-form team-settings-inline-form">
                <LabeledField label="Code" tooltip={codeTooltip}>
                  <input
                    className="sponsor-input"
                    value={categoryDraft.code}
                    onChange={(event) => setCategoryDraft((current) => ({ ...current, code: event.target.value }))}
                  />
                </LabeledField>
                <LabeledField label="Label" tooltip={labelTooltip}>
                  <input
                    className="sponsor-input"
                    value={categoryDraft.label}
                    onChange={(event) => setCategoryDraft((current) => ({ ...current, label: event.target.value }))}
                  />
                </LabeledField>
                <LabeledField label="Grupo">
                  <select
                    className="sponsor-input"
                    value={categoryDraft.teamGroupId}
                    onChange={(event) => setCategoryDraft((current) => ({ ...current, teamGroupId: event.target.value }))}
                  >
                    <option value="">Grupo</option>
                    {groups.map((group) => (
                      <option key={group.teamGroupId} value={group.teamGroupId}>
                        {group.label}
                        {group.active ? "" : " (inativo)"}
                      </option>
                    ))}
                  </select>
                </LabeledField>
                <button className="sponsor-button-primary" onClick={handleCreateCategory} type="button">
                  Add
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
    <section className="sponsor-panel">
      <div className="sponsor-panel-header">
        <div>
          <p className="sponsor-section-eyebrow">{eyebrow}</p>
          <h2 className="sponsor-panel-title">{title}</h2>
        </div>
      </div>

      {form}

      {isLoading ? (
        <div className="sponsor-empty-card">{loadingMessage}</div>
      ) : children.length === 0 ? (
        <div className="sponsor-empty-card">{emptyMessage}</div>
      ) : (
        <div className="sponsor-catalog-list">{children}</div>
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
      className={`sponsor-catalog-row team-settings-draggable-row ${group.active ? "" : "is-muted"} ${isDragging ? "is-dragging" : ""}`}
      draggable
      onDragOver={(event) => event.preventDefault()}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <div className="sponsor-catalog-reorder" title="Arrastar para reordenar">
        <GripVertical size={16} />
      </div>
      <div className="sponsor-catalog-fields team-settings-row-fields">
        <LabeledField label="Code" tooltip={codeTooltip}>
          <input className="sponsor-input" disabled={!isEditing} value={code} onChange={(event) => setCode(event.target.value)} />
        </LabeledField>
        <LabeledField label="Label" tooltip={labelTooltip}>
          <input className="sponsor-input" disabled={!isEditing} value={label} onChange={(event) => setLabel(event.target.value)} />
        </LabeledField>
      </div>
      <div className="sponsor-catalog-actions">
        <button
          className="sponsor-button-secondary"
          onClick={() => {
            if (isEditing) {
              resetEdit();
            }
            setIsEditing((current) => !current);
          }}
          type="button"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
        {isEditing ? (
          <button
            className="sponsor-button-primary"
            onClick={() => {
              onSave({ ...group, code, label });
              setIsEditing(false);
            }}
            type="button"
          >
            Save
          </button>
        ) : null}
        <button className="sponsor-button-ghost" onClick={onToggleActive} type="button">
          {group.active ? "Deactivate" : "Activate"}
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
      className={`sponsor-catalog-row team-settings-draggable-row ${category.active ? "" : "is-muted"} ${isDragging ? "is-dragging" : ""}`}
      draggable
      onDragOver={(event) => event.preventDefault()}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <div className="sponsor-catalog-reorder" title="Arrastar para reordenar">
        <GripVertical size={16} />
      </div>
      <div className="sponsor-catalog-fields team-settings-row-fields">
        <LabeledField label="Code" tooltip={codeTooltip}>
          <input className="sponsor-input" disabled={!isEditing} value={code} onChange={(event) => setCode(event.target.value)} />
        </LabeledField>
        <LabeledField label="Label" tooltip={labelTooltip}>
          <input className="sponsor-input" disabled={!isEditing} value={label} onChange={(event) => setLabel(event.target.value)} />
        </LabeledField>
        <LabeledField label="Grupo">
          <select className="sponsor-input" disabled={!isEditing} value={teamGroupId} onChange={(event) => setTeamGroupId(event.target.value)}>
            {groups.map((group) => (
              <option key={group.teamGroupId} value={group.teamGroupId}>
                {group.label}
                {group.active ? "" : " (inativo)"}
              </option>
            ))}
          </select>
        </LabeledField>
      </div>
      <div className="sponsor-catalog-actions">
        <button
          className="sponsor-button-secondary"
          onClick={() => {
            if (isEditing) {
              resetEdit();
            }
            setIsEditing((current) => !current);
          }}
          type="button"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
        {isEditing ? (
          <button
            className="sponsor-button-primary"
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
            Save
          </button>
        ) : null}
        <button className="sponsor-button-ghost" onClick={onToggleActive} type="button">
          {category.active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}
