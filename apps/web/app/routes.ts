import { index, layout, prefix, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  layout('routes/layouts/main/main-layout.tsx', [
    // /
    index('routes/public/home/home.tsx'),
    // /explore
    route('go/explore', 'routes/public/explore.tsx'),
    route('go/pricing', 'routes/public/pricing.tsx'),
    route('go/privacy', 'routes/public/privacy.tsx'),
    route('go/terms-of-service', 'routes/public/terms-of-service.tsx'),

    route('c/:publishedCourseId', 'routes/public/published-course-id-index.tsx', [
      route('enroll/:pricingTierId', 'routes/publishedCourses/enroll-index.tsx', [
        route('cancel', 'routes/publishedCourses/cancel-enroll.tsx'),
      ]),
      route('enroll/status', 'routes/publishedCourses/enroll-status.tsx'),
      route('complete', 'routes/publishedCourses/complete-course.tsx'),
      route('complete/:completedChapterId', 'routes/publishedCourses/complete-chapter.tsx'),
      route('reset', 'routes/publishedCourses/reset-course.tsx'),
    ]),

    route('api/check-username-exists', 'routes/api/check-username-exists.ts'),
    route('api/check-handle-exists/:organizationId', 'routes/api/check-handle-exists.ts'),
    route(
      'api/fetch-organization-available-credits/:organizationId',
      'routes/api/fetch-organization-available-credits.ts',
    ),
  ]),

  layout('routes/layouts/gonasi/gonasi-layout.tsx', [
    route('gonasi/dashboard', 'routes/gonasi/dashboard/gonasi-dashboard-index.tsx'),
  ]),

  route(
    'c/:publishedCourseId/:publishedChapterId/:publishedLessonId/play',
    'routes/publishedCourses/lesson-play/lesson-play-index.tsx',
    [
      route(':nextLessonId/complete', 'routes/publishedCourses/lesson-play/complete-lesson.tsx'),
      route('restart', 'routes/publishedCourses/lesson-play/restart-lesson.tsx'),
    ],
  ),

  // SEO resource routes - must be before :organizationHandle to avoid conflicts
  route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
  route('robots.txt', 'routes/robots[.]txt.ts'),

  route(':organizationHandle', 'routes/publicOrganizations/public-organization-profile-index.tsx'),

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

  layout('routes/layouts/organizations/organizations-layout.tsx', [
    route(':organizationId/dashboard', 'routes/organizations/dashboard/dashboard-index.tsx', [
      route(
        'subscriptions',
        'routes/organizations/dashboard/subscriptions/subscriptions-index.tsx',
        [
          route(':tier', 'routes/organizations/dashboard/subscriptions/subscribe-to-tier.tsx'),
          route('status', 'routes/organizations/dashboard/subscriptions/subscription-status.tsx'),
          route('plan-status', 'routes/organizations/dashboard/subscriptions/plan-status.tsx'),
        ],
      ),
    ]),

    route(
      'api/dashboard/fetch-total-courses-stats/:organizationId',
      'routes/api/dashboard/fetch-total-courses-stats.ts',
    ),
    route(
      'api/dashboard/fetch-total-students-stats/:organizationId',
      'routes/api/dashboard/fetch-total-students-stats.ts',
    ),
    route(
      'api/dashboard/fetch-total-course-enrollment-stats/:organizationId',
      'routes/api/dashboard/fetch-total-course-enrollment-stats.ts',
    ),
    route(
      'api/dashboard/fetch-total-course-re-enrollment-stats/:organizationId',
      'routes/api/dashboard/fetch-total-course-re-enrollment-stats.ts',
    ),
    route(
      'api/dashboard/fetch-organization-subscription-status/:organizationId',
      'routes/api/dashboard/fetch-organization-subscription-status.ts',
    ),
    route(
      'api/dashboard/fetch-organization-wallet-balance/:organizationId',
      'routes/api/dashboard/fetch-organization-wallet-balance.ts',
    ),

    route(':organizationId/members', 'routes/organizations/members/members-index.tsx', [
      route('active-members', 'routes/organizations/members/active-members.tsx', [
        route(':memberId/delete', 'routes/organizations/members/delete-member.tsx'),
        route(':memberId/edit-role', 'routes/organizations/members/edit-role.tsx'),
      ]),
      route('invites', 'routes/organizations/members/members-invites.tsx', [
        route('new-invite', 'routes/organizations/members/new-invite.tsx'),
        route('resend/:orgInviteId/:token', 'routes/organizations/members/resend-invite.tsx'),
        route('revoke/:orgInviteId/:token', 'routes/organizations/members/revoke-invite.tsx'),
      ]),
    ]),

    route(
      ':organizationId/financial-activity',
      'routes/organizations/financial-activity/financial-activity-index.tsx',
    ),

    route(':organizationId/builder', 'routes/organizations/builder/builder-index.tsx', [
      route('new-course-title', 'routes/organizations/builder/new-course-title.tsx'),
    ]),

    route(
      ':organizationId/builder/:courseId',
      'routes/organizations/builder/course/course-index.tsx',
      [
        route(
          'published',
          'routes/organizations/builder/course/published/published-overview-index.tsx',
        ),
        route('overview', 'routes/organizations/builder/course/overview/overview-index.tsx', [
          route(
            'edit-thumbnail',
            'routes/organizations/builder/course/overview/edit-thumbnail.tsx',
          ),
          route('edit-details', 'routes/organizations/builder/course/overview/edit-details.tsx'),
          route('edit-grouping', 'routes/organizations/builder/course/overview/edit-grouping.tsx'),
          route('publish', 'routes/organizations/builder/course/overview/publish-index.tsx'),
        ]),

        route('content', 'routes/organizations/builder/course/content/content-index.tsx', [
          ...prefix('chapter', [
            // /:username/builder/:courseId/content/chapter/new
            route(
              'new',
              'routes/organizations/builder/course/content/chapter/new-course-chapter.tsx',
            ),
          ]),
          ...prefix(':chapterId', [
            // /:username/builder/:courseId/content/:chapterId/edit-chapter
            route(
              'edit',
              'routes/organizations/builder/course/content/chapterId/edit-course-chapter.tsx',
            ),
            // /:username/builder/:courseId/content/:chapterId/delete-chapter
            route(
              'delete',
              'routes/organizations/builder/course/content/chapterId/delete-course-chapter.tsx',
            ),

            route(
              'lessons',
              'routes/organizations/builder/course/content/chapterId/lessonId/lessons-index.tsx',
              [
                // /:username/builder/:courseId/content/:chapterId/new-lesson-details
                route(
                  'new-lesson-details',
                  'routes/organizations/builder/course/content/chapterId/new-lesson-details.tsx',
                ),
                // /:username/builder/:courseId/content/:chapterId/:lessonId/edit-lesson-details
                route(
                  ':lessonId/edit-lesson-details',
                  'routes/organizations/builder/course/content/chapterId/lessonId/edit-lesson-details.tsx',
                ),
                // /:username/builder/:courseId/content/:chapterId/:lessonId/delete
                route(
                  ':lessonId/delete',
                  'routes/organizations/builder/course/content/chapterId/lessonId/delete-lesson.tsx',
                ),
              ],
            ),

            // /:username/builder/:courseId/content/:chapterId/:lessonId
            route(
              ':lessonId/lesson-blocks',
              'routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/lesson-blocks-index.tsx',
              [
                // /:username/builder/:courseId/content/:chapterId/:lessonId/plugins
                route(
                  'plugins',
                  'routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/plugin-index.tsx',
                  [
                    // /:username/builder/:courseId/content/:chapterId/:lessonId/plugins/:pluginGroupId
                    route(
                      ':pluginGroupId',
                      'routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/view-plugins-by-plugin-group-id-modal.tsx',
                      [
                        // /:username/builder/:courseId/content/:chapterId/:lessonId/plugins/:pluginGroupId/:pluginTypeId/create
                        route(
                          ':pluginTypeId/create',
                          'routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/create-block-by-plugin-id-modal.tsx',
                        ),
                      ],
                    ),
                  ],
                ),
                route(
                  ':blockId/edit',
                  'routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/edit-plugin-modal.tsx',
                ),
                // contains action to both edit and create block
                route(
                  ':blockId/upsert',
                  'routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/upsert-plugin-api.tsx',
                ),

                // /:username/builder/:courseId/content/:chapterId/:lessonId/:blockId/delete
                route(
                  ':blockId/delete',
                  'routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/plugins/delete-plugin-modal.tsx',
                ),
              ],
            ),
          ]),
        ]),

        route('pricing', 'routes/organizations/builder/course/pricing/pricing-index.tsx', [
          route(
            'update-pricing-type',
            'routes/organizations/builder/course/pricing/update-pricing-type-modal.tsx',
          ),
          route(
            'manage-pricing-tier/:coursePricingId',
            'routes/organizations/builder/course/pricing/manage-pricing-tier-modal.tsx',
          ),
          route(
            'manage-pricing-tier/:coursePricingId/delete',
            'routes/organizations/builder/course/pricing/delete-pricing-tier-modal.tsx',
          ),
        ]),

        // TODO: DELETE BELOW
        route(
          'file-library',
          'routes/organizations/builder/course/file-library/file-library-index.tsx',
          [
            route('new', 'routes/organizations/builder/course/file-library/new-file.tsx'),
            ...prefix(':fileId', [
              route('edit', 'routes/organizations/builder/course/file-library/edit-file-name.tsx'),

              route(
                'edit/image',
                'routes/organizations/builder/course/file-library/edit-file-image.tsx',
              ),

              route('delete', 'routes/organizations/builder/course/file-library/delete-file.tsx'),
            ]),
          ],
        ),
      ],
    ),

    route(':organizationId/storage', 'routes/organizations/storage/storage-index.tsx'),

    route(
      ':organizationId/settings',
      'routes/organizations/settings/organization-settings-index.tsx',
      [
        route(
          'organization-profile',
          'routes/organizations/settings/organization-profile/organization-profile-index.tsx',
          [
            route(
              'organization-information',
              'routes/organizations/settings/organization-profile/update-organization-information.tsx',
            ),
            route(
              'update-profile-photo',
              'routes/organizations/settings/organization-profile/update-organization-profile-photo.tsx',
            ),
            route(
              'update-organization-banner',
              'routes/organizations/settings/organization-profile/update-organization-banner.tsx',
            ),
          ],
        ),

        route('organization-security', 'routes/organizations/settings/organization-security.tsx'),
        route('organization-danger', 'routes/organizations/settings/organization-danger.tsx', [
          route('leave', 'routes/organizations/settings/leave-organization.tsx'),
        ]),
      ],
    ),
  ]),

  layout('routes/layouts/auth/auth-layout.tsx', [
    // /login
    route('login', 'routes/auth/login.tsx'),
    route('auth/v1/callback', 'routes/auth/callback.tsx'),
    route('auth/v1/auth-code-error', 'routes/auth/auth-code-error.tsx'),
    // /signup
    route('signup', 'routes/auth/signup.tsx'),
  ]),

  // onboarding - get user username
  route('go/onboarding/:userId', 'routes/onboarding/onboarding-index.tsx'),

  layout('routes/layouts/profile/course-overview-layout.tsx', [
    route('go/:username/settings', 'routes/myProfile/settings/settings-index.tsx', [
      route(
        'profile-information',
        'routes/myProfile/settings/account-settings/profile-information.tsx',
        [
          route(
            'personal-information',
            'routes/myProfile/settings/account-settings/updates/update-personal-information.tsx',
          ),
          route(
            'profile-photo',
            'routes/myProfile/settings/account-settings/updates/update-profile-photo.tsx',
          ),
        ],
      ),
      route(
        'login-and-security',
        'routes/myProfile/settings/account-settings/login-and-security.tsx',
      ),
      route('notifications', 'routes/myProfile/settings/account-settings/notifications.tsx'),
    ]),
  ]),

  route('api/paystack-webhook', 'routes/api/paystack-webhook.ts'),
  route('api/course-sub-categories', 'routes/api/course-sub-categories.ts'),
  route('api/files/:fileId/signed-url', 'routes/api/get-signed-url.ts'),
  route('api/files/:courseId/search', 'routes/api/search-files.ts'),
  route('api/files/prepare-upload', 'routes/api/files/prepare-upload.ts'),
  route('api/files/confirm-upload', 'routes/api/files/confirm-upload.ts'),
  route('api/courses/prepare-thumbnail-upload', 'routes/api/courses/prepare-thumbnail-upload.ts'),
  route('api/courses/confirm-thumbnail-upload', 'routes/api/courses/confirm-thumbnail-upload.ts'),

  route('signout', 'routes/auth/signout.tsx'),

  // /*
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
