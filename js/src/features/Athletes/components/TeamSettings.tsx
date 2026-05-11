import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Eye, EyeOff, GripVertical, ShieldAlert } from "lucide-react";
import {
  createTeamCategory,
  createTeamGroup,
  deactivateTeamCategory,
  deactivateTeamGroup,
  fetchAllTeamCategories,
  fetchAllTeamGroups,
  reorderTeamCategories,
  reorderTeamGroups,
  updateTeamCategory,
  updateTeamGroup,
  type TeamCategory,
  type TeamGroup,
} from "../../sponsors";
import { moveItem } from "../../sponsors/utils";

type TeamCategoryDraft = {
  code: string;
  label: string;
  teamGroupId: string;
};

type TeamGroupDraft = {
  code: string;
  label: string;
};

type DragState = {
  kind: "category" | "group";
  id: number;
} | null;

const emptyCategoryDraft: TeamCategoryDraft = {
  code: "",
  label: "",
  teamGroupId: "",
};

const emptyGroupDraft: TeamGroupDraft = {
  code: "",
  label: "",
};

const codeTooltip = "Code e o identificador curto usado internamente e nas regras de negocio.";
const labelTooltip = "Label e o nome visivel para admins e utilizadores.";

export default function TeamSettings() {
  const [categories, setCategories] = useState<TeamCategory[]>([]);
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [categoryDraft, setCategoryDraft] = useState<TeamCategoryDraft>(emptyCategoryDraft);
  const [groupDraft, setGroupDraft] = useState<TeamGroupDraft>(emptyGroupDraft);
  const [showInactive, setShowInactive] = useState(false);
  const [dragState, setDragState] = useState<DragState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  const visibleGroups = useMemo(
    () => groups.filter((group) => (showInactive ? !group.active : group.active)),
    [groups, showInactive],
  );

  const visibleCategories = useMemo(
    () => categories.filter((category) => (showInactive ? !category.active : category.active)),
    [categories, showInactive],
  );

  useEffect(() => {
    void refreshSettings();
  }, []);

  async function refreshSettings() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [nextCategories, nextGroups] = await Promise.all([
        fetchAllTeamCategories(),
        fetchAllTeamGroups(),
      ]);
      setCategories(nextCategories);
      setGroups(nextGroups);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar as equipas.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateGroup() {
    if (!groupDraft.code.trim() || !groupDraft.label.trim()) {
      setErrorMessage("Code e label sao obrigatorios.");
      return;
    }

    setErrorMessage("");
    setNotice("");

    try {
      await createTeamGroup({
        code: groupDraft.code.trim(),
        label: groupDraft.label.trim(),
        sortOrder: groups.length,
      });
      setGroupDraft(emptyGroupDraft);
      setNotice("Grupo criado com sucesso.");
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel criar o grupo.");
    }
  }

  async function handleCreateCategory() {
    if (!categoryDraft.code.trim() || !categoryDraft.label.trim()) {
      setErrorMessage("Code e label sao obrigatorios.");
      return;
    }

    const teamGroupId = Number.parseInt(categoryDraft.teamGroupId, 10);
    if (Number.isNaN(teamGroupId)) {
      setErrorMessage("Escolhe o grupo da equipa.");
      return;
    }

    setErrorMessage("");
    setNotice("");

    try {
      await createTeamCategory({
        code: categoryDraft.code.trim(),
        label: categoryDraft.label.trim(),
        teamGroupId,
        sortOrder: categories.length,
      });
      setCategoryDraft(emptyCategoryDraft);
      setNotice("Categoria criada com sucesso.");
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel criar a categoria.");
    }
  }

  async function handleSaveGroup(group: TeamGroup) {
    setErrorMessage("");
    setNotice("");

    try {
      await updateTeamGroup(group.teamGroupId, group);
      setNotice("Grupo atualizado.");
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar o grupo.");
    }
  }

  async function handleSaveCategory(category: TeamCategory) {
    setErrorMessage("");
    setNotice("");

    try {
      await updateTeamCategory(category.teamId, category);
      setNotice("Categoria atualizada.");
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar a categoria.");
    }
  }

  async function handleToggleGroup(group: TeamGroup) {
    setErrorMessage("");
    setNotice("");

    try {
      if (group.active) {
        await deactivateTeamGroup(group.teamGroupId);
        setNotice("Grupo desativado.");
      } else {
        await updateTeamGroup(group.teamGroupId, { ...group, active: true });
        setNotice("Grupo ativado.");
      }
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel alterar o estado do grupo.");
    }
  }

  async function handleToggleCategory(category: TeamCategory) {
    setErrorMessage("");
    setNotice("");

    try {
      if (category.active) {
        await deactivateTeamCategory(category.teamId);
        setNotice("Categoria desativada.");
      } else {
        await updateTeamCategory(category.teamId, { ...category, active: true });
        setNotice("Categoria ativada.");
      }
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel alterar o estado da categoria.");
    }
  }

  async function handleGroupDrop(targetId: number) {
    if (dragState?.kind !== "group" || dragState.id === targetId) {
      setDragState(null);
      return;
    }

    const fromIndex = groups.findIndex((group) => group.teamGroupId === dragState.id);
    const toIndex = groups.findIndex((group) => group.teamGroupId === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      setDragState(null);
      return;
    }

    const reordered = moveItem(groups, fromIndex, toIndex).map((group, index) => ({ ...group, sortOrder: index }));
    setGroups(reordered);
    setDragState(null);
    setErrorMessage("");
    setNotice("");

    try {
      await reorderTeamGroups(reordered.map((group) => group.teamGroupId));
      setNotice("Ordem dos grupos atualizada.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel reordenar os grupos.");
      await refreshSettings();
    }
  }

  async function handleCategoryDrop(targetId: number) {
    if (dragState?.kind !== "category" || dragState.id === targetId) {
      setDragState(null);
      return;
    }

    const fromIndex = categories.findIndex((category) => category.teamId === dragState.id);
    const toIndex = categories.findIndex((category) => category.teamId === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      setDragState(null);
      return;
    }

    const reordered = moveItem(categories, fromIndex, toIndex).map((category, index) => ({ ...category, sortOrder: index }));
    setCategories(reordered);
    setDragState(null);
    setErrorMessage("");
    setNotice("");

    try {
      await reorderTeamCategories(reordered.map((category) => category.teamId));
      setNotice("Ordem das categorias atualizada.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel reordenar as categorias.");
      await refreshSettings();
    }
  }

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
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(group.code);
  const [label, setLabel] = useState(group.label);

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
  category: TeamCategory;
  groups: TeamGroup[];
  isDragging: boolean;
  onDragStart: () => void;
  onDrop: () => void;
  onSave: (category: TeamCategory) => void;
  onToggleActive: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(category.code);
  const [label, setLabel] = useState(category.label);
  const [teamGroupId, setTeamGroupId] = useState(String(category.teamGroupId));

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

function LabeledField({
  children,
  label,
  tooltip,
}: {
  children: ReactNode;
  label: string;
  tooltip?: string;
}) {
  return (
    <label className="team-settings-field">
      <span className="team-settings-field-label">
        {label}
        {tooltip ? <span className="team-settings-tooltip">{tooltip}</span> : null}
      </span>
      {children}
    </label>
  );
}
