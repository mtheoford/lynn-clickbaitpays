export type DisplayNameType = "personal" | "business";

export type SiteIdentity = {
  firstName: string;
  lastName: string;
  fullName: string;
  companyName: string | null;
  displayNameType: DisplayNameType;
  displayName: string;
  initials: string;
};

type SiteIdentityInput = {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  displayNameType?: string | null;
};

export type SiteIdentityResult =
  | { identity: SiteIdentity; error: null }
  | { identity: null; error: string };

function initialsFor(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CB";
}

export function resolveSiteIdentity(input: SiteIdentityInput): SiteIdentityResult {
  const firstName = input.firstName?.trim() ?? "";
  const lastName = input.lastName?.trim() ?? "";
  const companyName = input.companyName?.trim() ?? "";
  const requestedType = input.displayNameType;

  if (!firstName || firstName.length > 60) {
    return { identity: null, error: "Enter a valid first name." };
  }
  if (!lastName || lastName.length > 60) {
    return { identity: null, error: "Enter a valid last name." };
  }

  const fullName = `${firstName} ${lastName}`;
  if (fullName.length > 120) {
    return { identity: null, error: "Keep your full name under 120 characters." };
  }
  if (companyName.length > 120) {
    return { identity: null, error: "Keep the company name under 120 characters." };
  }
  if (companyName && requestedType !== "personal" && requestedType !== "business") {
    return {
      identity: null,
      error: "Choose whether to display your personal name or business name.",
    };
  }

  const displayNameType: DisplayNameType =
    companyName && requestedType === "business" ? "business" : "personal";
  const displayName = displayNameType === "business" ? companyName : fullName;

  return {
    identity: {
      firstName,
      lastName,
      fullName,
      companyName: companyName || null,
      displayNameType,
      displayName,
      initials: initialsFor(displayName),
    },
    error: null,
  };
}
