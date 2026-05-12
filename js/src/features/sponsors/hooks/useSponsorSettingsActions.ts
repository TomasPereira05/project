import { useEffect, useState } from "react";
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
      setActionErrorMessage("Code e label sao obrigatorios.");
      return;
    }
    setActionErrorMessage("");
    setNotice("");
    try {
      if (kind === "pub") {
        const available = parseCatalogCount(draft.available);
        const price = centsFromEuroInput(draft.price ?? "0");
        if (!isValidPubCapacity(available)) {
          setActionErrorMessage("Available deve ser um inteiro positivo.");
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
      setNotice("Opcao criada com sucesso.");
      await refreshCatalogs();
    } catch (error) {
      setActionErrorMessage(error instanceof Error ? error.message : "Nao foi possivel criar a opcao.");
    }
  }

  async function handleSaveCatalogItem(kind: CatalogKind, item: CatalogItem) {
    setActionErrorMessage("");
    setNotice("");
    try {
      if (kind === "pub") await updatePubOption((item as PubOption).pubId, item as PubOption);
      else if (kind === "placement") await updateEquipmentPlacement((item as EquipmentPlacement).equipmentId, item as EquipmentPlacement);
      else await updateOtherSport((item as OtherSport).sportId, item as OtherSport);
      setNotice("Opcao atualizada.");
      await refreshCatalogs();
    } catch (error) {
      setActionErrorMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar a opcao.");
    }
  }

  async function handleDeactivateCatalogItem(kind: CatalogKind, id: number) {
    setActionErrorMessage("");
    setNotice("");
    try {
      if (kind === "pub") await deactivatePubOption(id);
      else if (kind === "placement") await deactivateEquipmentPlacement(id);
      else await deactivateOtherSport(id);
      setNotice("Opcao desativada.");
      await refreshCatalogs();
    } catch (error) {
      setActionErrorMessage(error instanceof Error ? error.message : "Nao foi possivel desativar a opcao.");
    }
  }

  async function handleCatalogDrop(kind: CatalogKind, targetIndex: number) {
    if (!dragState || dragState.kind !== kind) return;
    try {
      if (kind === "pub") await reorderPubOptions(moveItem(catalogs.pubOptions, dragState.index, targetIndex).map((item) => item.pubId));
      else if (kind === "placement") await reorderEquipmentPlacements(moveItem(catalogs.equipmentPlacements, dragState.index, targetIndex).map((item) => item.equipmentId));
      else await reorderOtherSports(moveItem(catalogs.otherSports, dragState.index, targetIndex).map((item) => item.sportId));
      setNotice("Ordem atualizada.");
      await refreshCatalogs();
    } catch (error) {
      setActionErrorMessage(error instanceof Error ? error.message : "Nao foi possivel reordenar.");
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
