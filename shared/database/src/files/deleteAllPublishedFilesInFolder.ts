import type { TypedSupabaseClient } from '../client';
import { PUBLISHED_FILE_LIBRARY_BUCKET } from '../constants';

interface DeleteArgs {
  organizationId: string;
  courseId: string;
  supabase: TypedSupabaseClient;
}

export async function deleteAllPublishedFilesInFolder({
  organizationId,
  courseId,
  supabase,
}: DeleteArgs): Promise<{ success: boolean; error?: Error }> {
  const folderPath = `${organizationId}/${courseId}`;

  async function recursivelyListFiles(path: string): Promise<string[]> {
    const files: string[] = [];

    const { data: items, error } = await supabase.storage
      .from(PUBLISHED_FILE_LIBRARY_BUCKET)
      .list(path, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error(`[deleteAllPublishedFilesInFolder] List error at ${path}:`, error.message);
      throw error;
    }

    for (const item of items ?? []) {
      if (item.name === '.emptyFolderPlaceholder') continue;

      const fullPath = `${path}/${item.name}`;

      if (item.metadata) {
        // It's a file
        files.push(fullPath);
      } else {
        // It's a folder — recurse into it
        const nestedFiles = await recursivelyListFiles(fullPath);
        files.push(...nestedFiles);
      }
    }

    return files;
  }

  try {
    const allFiles = await recursivelyListFiles(folderPath);

    if (allFiles.length === 0) {
      console.log(`[deleteAllPublishedFilesInFolder] No files to delete in ${folderPath}`);
      return { success: true };
    }

    const { error: deleteError } = await supabase.storage
      .from(PUBLISHED_FILE_LIBRARY_BUCKET)
      .remove(allFiles);

    if (deleteError) {
      console.error('[deleteAllPublishedFilesInFolder] Delete error:', deleteError.message);
      return { success: false, error: deleteError };
    }

    console.log(
      `[deleteAllPublishedFilesInFolder] Deleted ${allFiles.length} files from ${folderPath}`,
    );
    return { success: true };
  } catch (err) {
    console.error('[deleteAllPublishedFilesInFolder] Unexpected error:', (err as Error).message);
    return { success: false, error: err as Error };
  }
}
