Feature: User Profile Management

  Scenario: View own profile
    Given I am logged in as "Masterchef"
    When I visit my profile page "/profile/Masterchef"
    Then I should see my display name
    And I should see "Followers" count
    And I should see "Following" count
    And I should see the "Edit Profile" button
    And I should not see a "Follow" button

  Scenario: View another user's profile when logged in
    Given I am logged in as "Masterchef"
    When I visit another user's profile "/profile/wayne"
    Then I should see wayne's display name
    And I should see "Followers" count
    And I should see "Following" count
    And I should see the "Follow" button
    And I should not see an "Edit Profile" button

  Scenario: Follow another user
    Given I am logged in as "Masterchef"
    And I am on user "wayne" profile page
    And I am not following "wayne"
    When I click the "Follow" button
    Then the button should change to "Unfollow"
    And the followers count should increase by 1

  Scenario: Unfollow a user
    Given I am logged in as "Masterchef"
    And I am on user "wayne" profile page
    And I am already following "wayne"
    When I click the "Unfollow" button
    Then the button should change to "Follow"
    And the followers count should decrease by 1

  Scenario: Navigate to edit profile
    Given I am logged in as "Masterchef"
    When I visit my profile page "/profile/Masterchef"
    And I click the "Edit Profile" button
    Then I should be redirected to "/profile/edit"

  Scenario: Switch to Reviews tab
    Given I am logged in as "Masterchef"
    And I am on a user's profile page
    And I am viewing the "Recipes" tab
    When I click the "Reviews" tab
    Then the "Reviews" tab should be active
    And I should see the reviews content

  Scenario: Switch to Recipes tab
    Given I am logged in as "Masterchef"
    And I am on a user's profile page
    And I am viewing the "Reviews" tab
    When I click the "Recipes" tab
    Then the "Recipes" tab should be active
    And I should see the recipes content

  Scenario: View profile with level and chef type
    Given a user "wayne" has level 2 and chef type "Junior Cook"
    When I visit the profile page "/profile/wayne"
    Then I should see "Level 2"
    And I should see "Junior Cook"

  Scenario: View profile with bio
    Given a user "wayne" has a bio "I just cook"
    When I visit the profile page "/profile/wayne"
    Then I should see the bio "I just cook"

  Scenario: View profile without bio
    Given a user "almahmudsarker" has no bio
    When I visit the profile page "/profile/almahmudsarker"
    Then I should see "This user has not provided a bio yet."

  Scenario: View non-existent user profile
    When I visit the profile page "/profile/nonexistent"
    Then I should see an error "User not found."

