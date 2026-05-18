import { useEffect, useState } from "react";
import i18n from "../../../shared/i18n";
import {
  createEquipmentPlacement,
  createOtherSport,
  createPubOption,
  deactivateEquipmentPlacement,
  deactivateOtherSport,
  deactivatePubOption,
  reorderEquipmentPlacements,
  reorderOtherSports,
  reorderPubOptions,
  updateEquipmentPlacement,
  updateOtherSport,
  updatePubOption,
} from "../api";
import type { CatalogSnapshot, EquipmentPlacement, OtherSport, PubOption } from "../types";
import {
  buildTeamGroupPriceDrafts,
  buildTeamOverridePriceDrafts,
  createEmptyCatalogDraft,
  initialCatalogDrafts,
  isValidPubCapacity,
  parseCatalogCount,
  type CatalogEditor,
  type CatalogKind,
} from "../utils";
import { centsFromEuroInput, moveItem } from "../../../shared/utils";

type CatalogItem = PubOption | EquipmentPlacement | OtherSport;

export function useSponsorSettingsActions({
  catalogs,
  refreshCatalogs,
}: {
  catalogs: CatalogSnapshot;
  refreshCatalogs: () => Promise<void>;
}) {
  const [actionErrorMessage, setActionErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [catalogDrafts, setCatalogDrafts] = useState<Record<CatalogKind, CatalogEditor>>(initialCatalogDrafts);
  const [teamPriceDrafts, setTeamPriceDrafts] = useState<Record<string, string>>({});
  const [teamOverrideDrafts, setTeamOverrideDrafts] = useState<Record<string, string>>({});
  const [selectedOverrideTeamId, setSelectedOverrideTeamId] = useState("");
  const [dragState, setDragState] = useState<{ kind: CatalogKind; index: number } | null>(null);

  useEffect(() => {
    setTeamPriceDrafts(buildTeamGroupPriceDrafts(catalogs.teamGroupPrices));
    setTeamOverrideDrafts(buildTeamOverridePriceDrafts(catalogs.teamCategoryPriceOverrides));
  }, [catalogs]);

  async function handleCreateCatalog(kind: CatalogKind) {
    const draft = catalogDrafts[kind];
    if (!draft.code.trim() || !draft.label.trim()) {
      setActionErrorMessage(i18n.t("sponsors.settings.errors.requiredCodeLabel"));
      return;
    }
    setActionErrorMessage("");
    setNotice("");
    try {
      if (kind === "pub") {
        const available = parseCatalogCount(draft.available);
        const price = centsFromEuroInput(draft.price ?? "0");
        if (!isValidPubCapacity(available)) {
          setActionErrorMessage(i18n.t("sponsors.settings.errors.invalidAvailable"));
          return;
        }
        await createPubOption({ code: draft.code, label: draft.label, available, free: available, occupied: 0, price, sortOrder: catalogs.pubOptions.length });
      } else if (kind === "placement") {
        await createEquipmentPlacement({ ...draft, sortOrder: catalogs.equipmentPlacements.length });
      } else {
        await createOtherSport({ code: draft.code, label: draft.label, price: centsFromEuroInput(draft.price ?? "0"), sortOrder: catalogs.otherSports.length });
      }
      setCatalogDrafts((current) => ({
        ...current,
        [kind]: createEmptyCatalogDraft(kind),
      }));
      setNotice(i18n.t("sponsors.settings.notices.created"));
      await refreshCatalogs();
    } catch (error) {
      setActionErrorMessage(error instanceof Error ? error.message : i18n.t("sponsors.settings.errors.create"));
    }
  }

  async function handleSaveCatalogItem(kind: CatalogKind, item: CatalogItem) {
    setActionErrorMessage("");
    setNotice("");
    try {
      if (kind === "pub") await updatePubOption((item as PubOption).pubId, item as PubOption);
      else if (kind === "placement") await updateEquipmentPlacement((item as EquipmentPlacement).equipmentId, item as EquipmentPlacement);
      else await updateOtherSport((item as OtherSport).sportId, item as OtherSport);
      setNotice(i18n.t("sponsors.settings.notices.updated"));
      await refreshCatalogs();
    } catch (error) {
      setActionErrorMessage(error instanceof Error ? error.message : i18n.t("sponsors.settings.errors.update"));
    }
  }

  async function handleDeactivateCatalogItem(kind: CatalogKind, id: number) {
    setActionErrorMessage("");
    setNotice("");
    try {
      if (kind === "pub") await deactivatePubOption(id);
      else if (kind === "placement") await deactivateEquipmentPlacement(id);
      else await deactivateOtherSport(id);
      setNotice(i18n.t("sponsors.settings.notices.deactivated"));
      await refreshCatalogs();
    } catch (error) {
      setActionErrorMessage(error instanceof Error ? error.message : i18n.t("sponsors.settings.errors.deactivate"));
    }
  }

  async function handleCatalogDrop(kind: CatalogKind, targetIndex: number) {
    if (!dragState || dragState.kind !== kind) return;
    try {
      if (kind === "pub") await reorderPubOptions(moveItem(catalogs.pubOptions, dragState.index, targetIndex).map((item) => item.pubId));
      else if (kind === "placement") await reorderEquipmentPlacements(moveItem(catalogs.equipmentPlacements, dragState.index, targetIndex).map((item) => item.equipmentId));
      else await reorderOtherSports(moveItem(catalogs.otherSports, dragState.index, targetIndex).map((item) => item.sportId));
      setNotice(i18n.t("sponsors.settings.notices.reordered"));
      await refreshCatalogs();
    } catch (error) {
      setActionErrorMessage(error instanceof Error ? error.message : i18n.t("sponsors.settings.errors.reorder"));
    } finally {
      setDragState(null);
    }
  }

  return {
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
  };
}
