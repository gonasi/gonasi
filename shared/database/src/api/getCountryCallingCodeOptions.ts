export interface CountryDropdownOption {
  label: string;
  value: string;
  iso2: string;
  name: string;
  flag: string;
}

function isoToFlagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)));
}

export async function getCountryCallingCodeOptions(): Promise<CountryDropdownOption[]> {
  const res = await fetch('https://restcountries.com/v3.1/all');

  if (!res.ok) {
    throw new Error(`Failed to fetch country codes: ${res.statusText}`);
  }

  const data = await res.json();

  return data
    .filter((c: any) => c.idd?.root && c.cca2)
    .map((c: any): CountryDropdownOption => {
      const root = c.idd.root;
      const suffix =
        Array.isArray(c.idd.suffixes) && c.idd.suffixes.length > 0 ? c.idd.suffixes[0] : '';
      const callingCode = `${root}${suffix}`;

      const iso2 = c.cca2;
      const name = c.name?.common;
      const flag = isoToFlagEmoji(iso2);

      return {
        label: `${flag} ${name} (${callingCode})`,
        value: callingCode,
        iso2,
        name,
        flag,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
