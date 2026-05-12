import type { TeamCatalogCategory, TeamGroup } from "../types";

export type TeamCategoryDraft = {
  code: string;
  label: string;
  teamGroupId: string;
};

export type TeamGroupDraft = {
  code: string;
  label: string;
};

export type TeamSettingsDragState = {
  kind: "category" | "group";
  id: number;
} | null;

export const emptyCategoryDraft: TeamCategoryDraft = {
  code: "",
  label: "",
  teamGroupId: "",
};

export const emptyGroupDraft: TeamGroupDraft = {
  code: "",
  label: "",
};

export function getVisibleTeamGroups(groups: TeamGroup[], showInactive: boolean) {
  return groups.filter((group) => (showInactive ? !group.active : group.active));
}

export function getVisibleTeamCategories(categories: TeamCatalogCategory[], showInactive: boolean) {
  return categories.filter((category) => (showInactive ? !category.active : category.active));
}

export function withTeamGroupSortOrder(groups: TeamGroup[]) {
  return groups.map((group, index) => ({ ...group, sortOrder: index }));
}

export function withTeamCategorySortOrder(categories: TeamCatalogCategory[]) {
  return categories.map((category, index) => ({ ...category, sortOrder: index }));
}
