import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
} from "../api";
import type { TeamCatalogCategory, TeamGroup } from "../types";
import {
  emptyCategoryDraft,
  emptyGroupDraft,
  getVisibleTeamCategories,
  getVisibleTeamGroups,
  withTeamCategorySortOrder,
  withTeamGroupSortOrder,
  type TeamCategoryDraft,
  type TeamGroupDraft,
  type TeamSettingsDragState,
} from "../utils";
import { moveItemById } from "../../../shared/utils";

export function useTeamSettings() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<TeamCatalogCategory[]>([]);
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [categoryDraft, setCategoryDraft] = useState<TeamCategoryDraft>(emptyCategoryDraft);
  const [groupDraft, setGroupDraft] = useState<TeamGroupDraft>(emptyGroupDraft);
  const [showInactive, setShowInactive] = useState(false);
  const [dragState, setDragState] = useState<TeamSettingsDragState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  const visibleGroups = useMemo(
    () => getVisibleTeamGroups(groups, showInactive),
    [groups, showInactive],
  );

  const visibleCategories = useMemo(
    () => getVisibleTeamCategories(categories, showInactive),
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
      setErrorMessage(error instanceof Error ? error.message : t("athletes.teamSettings.errors.load"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateGroup() {
    if (!groupDraft.code.trim() || !groupDraft.label.trim()) {
      setErrorMessage(t("athletes.teamSettings.errors.requiredCodeLabel"));
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
      setNotice(t("athletes.teamSettings.notices.groupCreated"));
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("athletes.teamSettings.errors.createGroup"));
    }
  }

  async function handleCreateCategory() {
    if (!categoryDraft.code.trim() || !categoryDraft.label.trim()) {
      setErrorMessage(t("athletes.teamSettings.errors.requiredCodeLabel"));
      return;
    }

    const teamGroupId = Number.parseInt(categoryDraft.teamGroupId, 10);
    if (Number.isNaN(teamGroupId)) {
      setErrorMessage(t("athletes.teamSettings.errors.chooseGroup"));
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
      setNotice(t("athletes.teamSettings.notices.categoryCreated"));
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("athletes.teamSettings.errors.createCategory"));
    }
  }

  async function handleSaveGroup(group: TeamGroup) {
    setErrorMessage("");
    setNotice("");

    try {
      await updateTeamGroup(group.teamGroupId, group);
      setNotice(t("athletes.teamSettings.notices.groupUpdated"));
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("athletes.teamSettings.errors.updateGroup"));
    }
  }

  async function handleSaveCategory(category: TeamCatalogCategory) {
    setErrorMessage("");
    setNotice("");

    try {
      await updateTeamCategory(category.teamId, category);
      setNotice(t("athletes.teamSettings.notices.categoryUpdated"));
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("athletes.teamSettings.errors.updateCategory"));
    }
  }

  async function handleToggleGroup(group: TeamGroup) {
    setErrorMessage("");
    setNotice("");

    try {
      if (group.active) {
        await deactivateTeamGroup(group.teamGroupId);
        setNotice(t("athletes.teamSettings.notices.groupDeactivated"));
      } else {
        await updateTeamGroup(group.teamGroupId, { ...group, active: true });
        setNotice(t("athletes.teamSettings.notices.groupActivated"));
      }
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("athletes.teamSettings.errors.toggleGroup"));
    }
  }

  async function handleToggleCategory(category: TeamCatalogCategory) {
    setErrorMessage("");
    setNotice("");

    try {
      if (category.active) {
        await deactivateTeamCategory(category.teamId);
        setNotice(t("athletes.teamSettings.notices.categoryDeactivated"));
      } else {
        await updateTeamCategory(category.teamId, { ...category, active: true });
        setNotice(t("athletes.teamSettings.notices.categoryActivated"));
      }
      await refreshSettings();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("athletes.teamSettings.errors.toggleCategory"));
    }
  }

  async function handleGroupDrop(targetId: number) {
    if (dragState?.kind !== "group" || dragState.id === targetId) {
      setDragState(null);
      return;
    }

    const reordered = withTeamGroupSortOrder(
      moveItemById(groups, dragState.id, targetId, (group) => group.teamGroupId),
    );
    setGroups(reordered);
    setDragState(null);
    setErrorMessage("");
    setNotice("");

    try {
      await reorderTeamGroups(reordered.map((group) => group.teamGroupId));
      setNotice(t("athletes.teamSettings.notices.groupsReordered"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("athletes.teamSettings.errors.reorderGroups"));
      await refreshSettings();
    }
  }

  async function handleCategoryDrop(targetId: number) {
    if (dragState?.kind !== "category" || dragState.id === targetId) {
      setDragState(null);
      return;
    }

    const reordered = withTeamCategorySortOrder(
      moveItemById(categories, dragState.id, targetId, (category) => category.teamId),
    );
    setCategories(reordered);
    setDragState(null);
    setErrorMessage("");
    setNotice("");

    try {
      await reorderTeamCategories(reordered.map((category) => category.teamId));
      setNotice(t("athletes.teamSettings.notices.categoriesReordered"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("athletes.teamSettings.errors.reorderCategories"));
      await refreshSettings();
    }
  }

  return {
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
  };
}
