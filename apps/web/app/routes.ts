import { index, layout, prefix, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  layout('routes/layouts/main/main-layout.tsx', [
    // /
    index('routes/public/home.tsx'),
    // /explore
    route('go/explore', 'routes/public/explore.tsx'),
    route('go/pricing', 'routes/public/pricing.tsx'),

    route('c/:publishedCourseId', 'routes/public/published-course-id-index.tsx', [
      route('enroll/:pricingTierId', 'routes/publishedCourses/enroll-index.tsx', [
        route('verify', 'routes/publishedCourses/verify-enroll.tsx'),
      ]),
    ]),

    route('api/check-username-exists', 'routes/api/check-username-exists.ts'),
  ]),

  layout('routes/layouts/myProfile/profile-plain-layout.tsx', [
    layout('routes/layouts/myProfile/profile-wrapper-layout.tsx', [
      layout('routes/layouts/myProfile/my-profile-layout.tsx', [
        // my profile
        route('go/:username', 'routes/myProfile/learning-index.tsx'),
        route('go/:username/history', 'routes/myProfile/history-index.tsx'),
      ]),
    ]),
    route('go/:username/organizations', 'routes/myProfile/organizations/organizations-index.tsx', [
      route('new', 'routes/myProfile/organizations/new-organization.tsx'),
    ]),

    route('i/org-invites/:token/accept', 'routes/invites/accept-org-invite.tsx'),
  ]),

  layout('routes/layouts/organizations/organizations-layout.tsx', [
    route(':organizationId/dashboard', 'routes/organizations/dashboard/dashboard-index.tsx'),

    route(':organizationId/members', 'routes/organizations/members/members-index.tsx', [
      route('active-members', 'routes/organizations/members/active-members.tsx'),
      route('invites', 'routes/organizations/members/members-invites.tsx', [
        route('new-invite', 'routes/organizations/members/new-invite.tsx'),
      ]),
    ]),
    route(':organizationId/courses', 'routes/organizations/courses/courses-index.tsx'),
    route(
      ':organizationId/settings',
      'routes/organizations/settings/organization-settings-index.tsx',
      [
        route('organization-profile', 'routes/organizations/settings/organization-profile.tsx'),
        route('organization-security', 'routes/organizations/settings/organization-security.tsx'),
      ],
    ),
  ]),

  layout('routes/layouts/auth/auth-layout.tsx', [
    // /login
    route('login', 'routes/auth/login.tsx'),
    // /signup
    route('signup', 'routes/auth/signup.tsx'),
  ]),

  // onboarding - get user username
  route('go/onboarding/:userId', 'routes/onboarding/onboarding-index.tsx'),

  layout('routes/layouts/profile/course-overview-layout.tsx', [
    route('go/:username/settings', 'routes/profile/settings/settings-index.tsx', [
      route(
        'profile-information',
        'routes/profile/settings/account-settings/profile-information.tsx',
        [
          route(
            'personal-information',
            'routes/profile/settings/account-settings/updates/update-personal-information.tsx',
          ),
          route(
            'profile-photo',
            'routes/profile/settings/account-settings/updates/update-profile-photo.tsx',
          ),
        ],
      ),
      route(
        'login-and-security',
        'routes/profile/settings/account-settings/login-and-security.tsx',
      ),
      route('notifications', 'routes/profile/settings/account-settings/notifications.tsx'),
    ]),

    ...prefix(':username/course-builder', [
      // /:username/course-builder/:courseId
      route(':courseId', 'routes/profile/course-builder/courseId/course-id-index.tsx', [
        // /:username/course-builder/:courseId/overview
        route('overview', 'routes/profile/course-builder/courseId/overview/overview-index.tsx', [
          route('publish', 'routes/profile/course-builder/courseId/overview/publish-index.tsx'),
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
        route('pricing', 'routes/profile/course-builder/courseId/pricing/pricing-index.tsx', [
          route(
            'update-pricing-type',
            'routes/profile/course-builder/courseId/pricing/update-pricing-type-modal.tsx',
          ),
          route(
            'manage-pricing-tier/:coursePricingId',
            'routes/profile/course-builder/courseId/pricing/manage-pricing-tier-modal.tsx',
          ),
          route(
            'manage-pricing-tier/:coursePricingId/delete',
            'routes/profile/course-builder/courseId/pricing/delete-pricing-tier-modal.tsx',
          ),
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
        route(
          'file-library',
          'routes/profile/course-builder/courseId/file-library/file-library-index.tsx',
          [
            route('new', 'routes/profile/course-builder/courseId/file-library/new-file.tsx'),
            ...prefix(':fileId', [
              route(
                'edit',
                'routes/profile/course-builder/courseId/file-library/edit-file-name.tsx',
              ),

              route(
                'edit/image',
                'routes/profile/course-builder/courseId/file-library/edit-file-image.tsx',
              ),

              route(
                'delete',
                'routes/profile/course-builder/courseId/file-library/delete-file.tsx',
              ),
            ]),
          ],
        ),

        // /:username/course-builder/:courseId/collaborators
        route(
          'collaborators',
          'routes/profile/course-builder/courseId/collaborators/view-all-course-collaborators.tsx',
        ),
      ]),
    ]),
  ]),

  route('api/paystack-webhook', 'routes/api/paystack-webhook.ts'),

  route('signout', 'routes/auth/signout.tsx'),

  // /*
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
