import { index, layout, prefix, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  layout('routes/layouts/main/main-layout.tsx', [
    // /
    index('routes/public/home.tsx'),
    // /explore
    route('explore', 'routes/public/explore.tsx'),
    layout('routes/layouts/profile/profile-layout.tsx', [
      // /:username
      route(':username', 'routes/profile/published-courses/index.tsx'),
      // /:username/pathways
      route(':username/pathways', 'routes/profile/pathways/index.tsx'),
      // /:username/file-library
      route(':username/file-library', 'routes/profile/file-library/index.tsx'),
      // /:username/course-builder
      route(':username/course-builder', 'routes/profile/course-builder/course-builder-index.tsx', [
        layout('routes/layouts/profile/course-crud-layout.tsx', [
          // /:username/course-builder/new
          route('new', 'routes/profile/course-builder/new.tsx'),
        ]),
      ]),
    ]),
  ]),

  layout('routes/layouts/auth/auth-layout.tsx', [
    // /login
    route('login', 'routes/auth/login.tsx'),
    // /signup
    route('signup', 'routes/auth/signup.tsx'),
  ]),

  layout('routes/layouts/onboarding/onboarding-layout.tsx', [
    ...prefix('onboarding', [
      // /onboarding/:userId/basic-information
      route(':userId/basic-information', 'routes/onboarding/basic-information.tsx'),
      // /onboarding/:userId/contact-information
      route(':userId/contact-information', 'routes/onboarding/contact-information.tsx'),
    ]),
  ]),

  ...prefix('dashboard/:companyId', [
    layout('routes/layouts/dashboard/dashboard.tsx', [
      // /dashboard/:companyId
      index('routes/dashboard/dashboard.tsx'),
      // /dashboard/:companyId/team-management
      route('/team-management', 'routes/dashboard/team-management/team-management.tsx', [
        // /dashboard/:companyId/team-management/staff-directory
        route('staff-directory', 'routes/dashboard/team-management/staff-directory.tsx', [
          // /dashboard/:companyId/team-management/staff-directory/edit-role/:staffId
          route('edit-role/:staffId', 'routes/dashboard/team-management/edit-staff-role.tsx'),
          // /dashboard/:companyId/team-management/staff-directory/remove-staff/:staffId
          route('remove-staff/:staffId', 'routes/dashboard/team-management/remove-staff.tsx'),
        ]),
        // /dashboard/:companyId/team-management/staff-teams
        route('staff-teams', 'routes/dashboard/team-management/staff-teams.tsx'),
        // /dashboard/:companyId/team-management/staff-invites
        route('staff-invites', 'routes/dashboard/team-management/staff-invites.tsx', [
          // /dashboard/:companyId/team-management/staff-invites/new
          route('new', 'routes/dashboard/team-management/new-staff-invite.tsx'),
        ]),
      ]),
      // /dashboard/:companyId/learning-paths
      route('learning-paths', 'routes/dashboard/pathways/all-learning-paths.tsx'),
      // /dashboard/:companyId/courses
      route('courses', 'routes/dashboard/courses/all-courses.tsx'),
      // /dashboard/:companyId/resource-center
      route('resource-center', 'routes/dashboard/resource-center.tsx'),
      // /dashboard/:companyId/file-library
      route('file-library', 'routes/dashboard/file-library/all-files.tsx', [
        ...prefix(':fileId', [
          // /dashboard/:companyId/file-library/:fileId/edit
          route('edit', 'routes/dashboard/file-library/edit-file-name.tsx'),
          // /dashboard/:companyId/file-library/:fileId/edit/image
          route('edit/image', 'routes/dashboard/file-library/edit-file-image.tsx'),
          // /dashboard/:companyId/file-library/:fileId/delete
          route('delete', 'routes/dashboard/file-library/delete-file.tsx'),
        ]),
      ]),
      // /dashboard/:companyId/revenue
      route('revenue', 'routes/dashboard/revenue.tsx'),
    ]),
  ]),

  ...prefix('dashboard', [
    layout('routes/layouts/dashboard/dashboard-plain.tsx', [
      // /dashboard/:companyId/learning-paths/new
      route('/:companyId/learning-paths/new', 'routes/dashboard/pathways/new-learning-path.tsx'),
      // /dashboard/:companyId/file-library/new
      route('/:companyId/file-library/new', 'routes/dashboard/file-library/new-file.tsx'),
      // /dashboard/:companyId/learning-paths/:learningPathId
      route(
        '/:companyId/learning-paths/:learningPathId',
        'routes/dashboard/pathways/view-learning-path-by-id.tsx',
        [
          // /dashboard/:companyId/learning-paths/:learningPathId/edit
          route('edit', 'routes/dashboard/pathways/edit-learning-path-details-by-id.tsx'),
          // /dashboard/:companyId/learning-paths/:learningPathId/edit/image
          route('edit/image', 'routes/dashboard/pathways/edit-learning-path-image-by-id.tsx'),
          // /dashboard/:companyId/learning-paths/:learningPathId/delete
          route('delete', 'routes/dashboard/pathways/delete-learning-path-by-id.tsx'),
          // /dashboard/:companyId/learning-paths/:learningPathId/course/add
          route('course/add', 'routes/dashboard/pathways/add-course-to-learning-path.tsx'),
          // /dashboard/:companyId/learning-paths/:learningPathId/course/:courseId/remove
          route(
            'course/:courseId/remove',
            'routes/dashboard/pathways/remove-course-to-learning-path.tsx',
          ),
        ],
      ),
    ]),
  ]),

  layout('routes/layouts/profile/course-overview-layout.tsx', [
    ...prefix(':username/course-builder', [
      // /:username/course-builder/:courseId
      route(':courseId', 'routes/profile/course-builder/courseId/course-id-index.tsx', [
        // /:username/course-builder/:courseId/overview
        route('overview', 'routes/profile/course-builder/courseId/overview/overview-index.tsx', [
          // /:username/course-builder/:courseId/overview/edit-thumbnail
          route(
            'edit-thumbnail',
            'routes/profile/course-builder/courseId/overview/edit-thumbnail.tsx',
          ),
          // /:username/course-builder/:courseId/overview/edit-details
          route('edit-details', 'routes/profile/course-builder/courseId/overview/edit-details.tsx'),
          ...prefix('grouping', [
            layout('routes/layouts/profile/course-grouping.tsx', [
              // /:username/course-builder/:courseId/overview/grouping/edit-category
              route(
                'edit-category',
                'routes/profile/course-builder/courseId/overview/grouping/edit-course-category.tsx',
              ),
              // /:username/course-builder/:courseId/overview/grouping/edit-subcategory
              route(
                'edit-subcategory',
                'routes/profile/course-builder/courseId/overview/grouping/edit-course-subcategory.tsx',
              ),
              // /:username/course-builder/:courseId/overview/grouping/edit-pathway
              route(
                'edit-pathway',
                'routes/profile/course-builder/courseId/overview/grouping/edit-course-pathway.tsx',
              ),
            ]),
          ]),
        ]),
        // /:username/course-builder/:courseId/content
        route('content', 'routes/profile/course-builder/courseId/content/content-index.tsx', [
          ...prefix('chapter', [
            // /:username/course-builder/:courseId/content/chapter/new
            route(
              'new',
              'routes/profile/course-builder/courseId/content/chapter/new-course-chapter.tsx',
            ),
          ]),
          ...prefix(':chapterId', [
            // /:username/course-builder/:courseId/content/:chapterId/edit-chapter
            route(
              'edit',
              'routes/profile/course-builder/courseId/content/chapterId/edit-course-chapter.tsx',
            ),
            // /:username/course-builder/:courseId/content/:chapterId/delete-chapter
            route(
              'delete',
              'routes/profile/course-builder/courseId/content/chapterId/delete-course-chapter.tsx',
            ),
            // /:username/course-builder/:courseId/content/:chapterId/new-lesson-details
            route(
              'new-lesson-details',
              'routes/profile/course-builder/courseId/content/chapterId/new-lesson-details.tsx',
            ),
            // /:username/course-builder/:courseId/content/:chapterId/:lessonId/edit-lesson-details
            route(
              ':lessonId/edit-lesson-details',
              'routes/profile/course-builder/courseId/content/chapterId/lessonId/edit-lesson-details.tsx',
            ),
            // /:username/course-builder/:courseId/content/:chapterId/:lessonId/delete
            route(
              ':lessonId/delete',
              'routes/profile/course-builder/courseId/content/chapterId/lessonId/delete-lesson.tsx',
            ),
            // /:username/course-builder/:courseId/content/:chapterId/:lessonId
            route(
              ':lessonId/lesson-blocks',
              'routes/profile/course-builder/courseId/content/chapterId/lessonId/lesson-blocks/lesson-blocks-index.tsx',
              [
                // /:username/course-builder/:courseId/content/:chapterId/:lessonId/plugins
                route(
                  'plugins',
                  'routes/profile/course-builder/courseId/content/chapterId/lessonId/lesson-blocks/plugins/plugin-index.tsx',
                  [
                    // /:username/course-builder/:courseId/content/:chapterId/:lessonId/plugins/:pluginGroupId
                    route(
                      ':pluginGroupId',
                      'routes/profile/course-builder/courseId/content/chapterId/lessonId/lesson-blocks/plugins/view-plugins-by-plugin-group-id-modal.tsx',
                      [
                        // /:username/course-builder/:courseId/content/:chapterId/:lessonId/plugins/:pluginGroupId/:pluginTypeId/create
                        route(
                          ':pluginTypeId/create',
                          'routes/profile/course-builder/courseId/content/chapterId/lessonId/lesson-blocks/plugins/create-block-by-plugin-id-modal.tsx',
                        ),
                      ],
                    ),
                  ],
                ),
                route(
                  ':blockId/edit',
                  'routes/profile/course-builder/courseId/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal.tsx',
                ),
                // contains action to both edit and create block
                route(
                  ':blockId/upsert',
                  'routes/profile/course-builder/courseId/content/chapterId/lessonId/lesson-blocks/plugins/upsert-plugin-api.tsx',
                ),

                // /:username/course-builder/:courseId/content/:chapterId/:lessonId/:blockId/delete
                route(
                  ':blockId/delete',
                  'routes/profile/course-builder/courseId/content/chapterId/lessonId/lesson-blocks/plugins/delete-plugin-modal.tsx',
                ),
              ],
            ),
          ]),
        ]),
        // /:username/course-builder/:courseId/collaborators
        route(
          'collaborators',
          'routes/profile/course-builder/courseId/collaborators/view-all-course-collaborators.tsx',
        ),
      ]),
    ]),
  ]),

  // /*
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
