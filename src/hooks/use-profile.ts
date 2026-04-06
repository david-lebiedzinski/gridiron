import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/auth";
import {
  getProfile,
  getProfiles,
  createProfile,
  updateProfile,
} from "../lib/profile";
import type { ProfileInsert, ProfileUpdate } from "../lib/types";

const KEYS = {
  all: ["profiles"] as const,
  detail: (id: string) => ["profiles", id] as const,
};

export function useProfile() {
  const { user } = useAuth();
  const id = user?.id ?? "";

  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => getProfile(id),
    enabled: !!id,
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: getProfiles,
  });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: ProfileInsert) => createProfile(profile),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: ProfileUpdate) =>
      updateProfile(user!.id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(user!.id) });
    },
  });
}
