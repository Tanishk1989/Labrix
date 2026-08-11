function filteredRoute(pathname: string, key: string, value: string) {
  const query = new URLSearchParams({ [key]: value });
  return `${pathname}?${query.toString()}`;
}

export function legacyRouteDestination(slug: string[] | undefined) {
  if (!slug?.length) return "/dashboard";

  if (
    slug.length === 3 &&
    slug[0] === "classes" &&
    slug[2] === "tasks"
  ) {
    return filteredRoute("/practicals", "classroom", slug[1]);
  }

  if (
    slug.length === 3 &&
    slug[0] === "tasks" &&
    slug[2] === "my-submissions"
  ) {
    return filteredRoute("/submissions", "practical", slug[1]);
  }

  return null;
}
