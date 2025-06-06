import { index, layout, prefix, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  layout('routes/layouts/main/main-layout.tsx', [
    index('routes/public/home.tsx'),
    route('explore', 'routes/public/explore.tsx'),
    // all user profiles
    layout('routes/layouts/profile/profile-layout.tsx', [
      route(':username', 'routes/profile/courses/courses.tsx', [
        layout('routes/layouts/profile/course-crud-layout.tsx', [
          // new course title
          route('course/new', 'routes/profile/courses/new-course-title.tsx'),
        ]),
      ]),
      route(':username/pathways', 'routes/profile/pathways.tsx'),
      route(':username/file-library', 'routes/profile/file-library.tsx'),
      route(':username/team-management', 'routes/profile/team-management.tsx'),
    ]),
  ]),

  layout('routes/layouts/auth/auth-layout.tsx', [
    route('login', 'routes/auth/login.tsx'),
    route('signup', 'routes/auth/signup.tsx'),
  ]),

  ...prefix('onboarding', [
    layout('routes/layouts/onboarding/onboarding-layout.tsx', [
      route(':userId/basic-information', 'routes/onboarding/basic-information.tsx'),
      route(':userId/contact-information', 'routes/onboarding/contact-information.tsx'),
    ]),
  ]),

  ...prefix('go', [
    layout('routes/layouts/go/go-layout.tsx', [
      index('routes/go/go.tsx'),
      route('courses', 'routes/go/courses.tsx', [
        route(':courseId', 'routes/go/go-course-details.tsx'),
      ]),
    ]),
  ]),

  ...prefix('go/course/:courseId/:chapterId/:lessonId', [
    layout('routes/layouts/go/go-lesson-play-layout.tsx', [
      route('play', 'routes/go/go-lesson-play.tsx', [
        route('completed', 'routes/go/go-lesson-completed.tsx'),
        route('restart', 'routes/go/go-lesson-restart.tsx'),
      ]),
    ]),
  ]),

  // change team
  ...prefix('dashboard', [
    layout('routes/layouts/dashboard/dashboard-plain-team.tsx', [
      route('/change-team', 'routes/dashboard/team-management/change-team.tsx', [
        route('leave-team/:companyId', 'routes/dashboard/team-management/leave-team.tsx'),
      ]),
    ]),
  ]),

  ...prefix('dashboard/:companyId', [
    layout('routes/layouts/dashboard/dashboard.tsx', [
      index('routes/dashboard/dashboard.tsx'), //ROUTE: /dashboard/:companyId

      route('/team-management', 'routes/dashboard/team-management/team-management.tsx', [
        route('staff-directory', 'routes/dashboard/team-management/staff-directory.tsx', [
          route('edit-role/:staffId', 'routes/dashboard/team-management/edit-staff-role.tsx'),
          route('remove-staff/:staffId', 'routes/dashboard/team-management/remove-staff.tsx'),
        ]),
        route('staff-teams', 'routes/dashboard/team-management/staff-teams.tsx'),
        route('staff-invites', 'routes/dashboard/team-management/staff-invites.tsx', [
          route('new', 'routes/dashboard/team-management/new-staff-invite.tsx'),
        ]),
      ]),
      route('learning-paths', 'routes/dashboard/pathways/all-learning-paths.tsx'),
      route('courses', 'routes/dashboard/courses/all-courses.tsx'),
      route('resource-center', 'routes/dashboard/resource-center.tsx'),
      route('file-library', 'routes/dashboard/file-library/all-files.tsx', [
        ...prefix(':fileId', [
          route('edit', 'routes/dashboard/file-library/edit-file-name.tsx'),
          route('edit/image', 'routes/dashboard/file-library/edit-file-image.tsx'),
          route('delete', 'routes/dashboard/file-library/delete-file.tsx'),
        ]),
      ]),

      route('revenue', 'routes/dashboard/revenue.tsx'),
    ]),
  ]),

  // learning paths and courses
  ...prefix('dashboard', [
    layout('routes/layouts/dashboard/dashboard-plain.tsx', [
      route('/:companyId/learning-paths/new', 'routes/dashboard/pathways/new-learning-path.tsx'),

      route('/:companyId/file-library/new', 'routes/dashboard/file-library/new-file.tsx'),
      route(
        '/:companyId/learning-paths/:learningPathId',
        'routes/dashboard/pathways/view-learning-path-by-id.tsx',
        [
          route('edit', 'routes/dashboard/pathways/edit-learning-path-details-by-id.tsx'),
          route('edit/image', 'routes/dashboard/pathways/edit-learning-path-image-by-id.tsx'),
          route('delete', 'routes/dashboard/pathways/delete-learning-path-by-id.tsx'),
          route('course/add', 'routes/dashboard/pathways/add-course-to-learning-path.tsx'),
          route(
            'course/:courseId/remove',
            'routes/dashboard/pathways/remove-course-to-learning-path.tsx',
          ),
        ],
      ),
    ]),
  ]),

  layout('routes/layouts/profile/course-overview-layout.tsx', [
    ...prefix(':username/course', [
      route(':courseId', 'routes/profile/courses/course-by-id.tsx', [
        route('overview', 'routes/profile/courses/course-overview.tsx', [
          route('edit-image', 'routes/profile/courses/edit-course-image.tsx'),
          route('edit-details', 'routes/profile/courses/edit-course-details.tsx'),
          ...prefix('grouping', [
            layout('routes/layouts/profile/course-grouping.tsx', [
              route('edit-category', 'routes/profile/courses/edit-course-category.tsx'),
              route('edit-subcategory', 'routes/profile/courses/edit-course-subcategory.tsx'),
              route('edit-pathway', 'routes/profile/courses/edit-course-pathway.tsx'),
            ]),
          ]),
        ]),
        route('course-content', 'routes/dashboard/courses/course-content.tsx', [
          ...prefix('chapter', [
            route('new', 'routes/dashboard/courses/chapters/new-course-chapter.tsx'),
          ]),
          ...prefix(':chapterId', [
            route('edit-chapter', 'routes/dashboard/courses/chapters/edit-course-chapter.tsx'),
            route('delete-chapter', 'routes/dashboard/courses/chapters/delete-course-chapter.tsx'),
            route('new-lesson-details', 'routes/dashboard/courses/lessons/new-lesson-details.tsx'),
            route(
              ':lessonId/edit-lesson-details',
              'routes/dashboard/courses/lessons/edit-lesson-details.tsx',
            ),
            route(':lessonId/delete', 'routes/dashboard/courses/lessons/delete-lesson.tsx'),
            // view all blocks by course creator
            // /dashboard/:companyId/courses/:courseId/course-content/:chapterId/:lessonId
            route(':lessonId', 'routes/dashboard/courses/lessons/edit-lesson-content.tsx', [
              route(
                'plugins',
                'routes/dashboard/courses/lessons/plugins/view-all-plugins-modal.tsx',
                [
                  route(
                    ':pluginGroupId',
                    'routes/dashboard/courses/lessons/plugins/view-plugins-by-plugin-group-id-modal.tsx',
                    [
                      route(
                        ':pluginTypeId/create',
                        'routes/dashboard/courses/lessons/plugins/create-block-by-plugin-id-modal.tsx',
                      ),
                    ],
                  ),
                ],
              ),
              route(
                ':blockId/edit',
                'routes/dashboard/courses/lessons/plugins/edit-plugin-modal.tsx',
              ),
              route(
                ':blockId/settings',
                'routes/dashboard/courses/lessons/plugins/edit-plugin-settings-modal.tsx',
              ),
              route(
                ':blockId/delete',
                'routes/dashboard/courses/lessons/plugins/delete-plugin-modal.tsx',
              ),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]),

  route('sign-out', 'routes/sign-out.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
