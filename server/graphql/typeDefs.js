export default `#graphql
  scalar PlanID
  scalar SubscriptionID
  scalar Username
  scalar Email
  scalar SetupIntentID
  scalar PaymentMethodID
  scalar TestClockID
  scalar DateTime
  scalar Date
  scalar USCurrency

  type Query {
    viewOnePlan (planId: PlanID!): PlanDetail!
    viewAllPlans (offset: Int, limit: Int, orderBy: PlanOrderCategory, filterByOwnership: Boolean): AllPlansSummary!
    retrieveNotifications: RetrieveNotifications! # offset pagination?
    getEmail: UserInfo!
    successfulPayment(setupIntentId: SetupIntentID!): SuccessfulPaymentData!
  }

  type UserInfo {
    username: String!
    email: Email!
  }

  type LoginInfo {
    username: String!
    # username: Username!
    token: String!
  }

  type PaymentIntentAndPaymentMethods {
    clientSecret: String!
    setupIntentId: SetupIntentID!
    paymentMethods: [PaymentMethod]!
  }

  type PaymentMethod {
    id: PaymentMethodID!
    brand: String!
    last4: String!
    expiryMonth: Int!
    expiryYear: Int!
    default: Boolean!
  }

  type PlanIdResponse {
    planId: PlanID!
    status: UpdateStatus!
  }

  type PortalSession {
    portalSessionURL: String!
  }

  type EditQuantResponse {
    planId: PlanID!
    quantity: Int!
  }

  type TransferOwnershipResponse {
    planId: PlanID!
    newOwner: PlanOwner! #username
  }

  enum CycleFrequency {
    WEEKLY
    MONTHLY
    YEARLY
  }

  enum UpdateStatus {
    DELETED
    ARCHIVED
  }

  enum PlanOrderCategory {
    PLAN_NAME
    SELF_COST
    NEXT_BILL_DATE
  }

  type AllPlansSummary {
    total: Int!,
    plans: [PlanSummary]!
  }

  type PlanSummary {
    planId: PlanID!
    name : String!
    quantity: Int!
    selfCost: USCurrency!
    cycleFrequency: CycleFrequency!
    perCycleCost: USCurrency!
    startDate: Date!
    nextBillDate: Date!
    isOwner: Boolean!
    owner: PlanOwner!
  }

  type PlanOwner {
    firstName: String!
    lastName: String!
    username: ID!
  }

  type PlanMember {
    firstName: String!
    lastName: String!
    quantity: Int!
    joinedDate: Date!
    isOwner: Boolean!
    username: ID!
  }

  type PlanDetail {
    planId: PlanID!
    name: String!
    quantity: Int!
    selfCost: USCurrency!
    cycleFrequency: CycleFrequency!
    perCycleCost: USCurrency!
    startDate: Date!
    totalMembers: Int! # including self
    totalQuantity: Int! # including self
    subscriptionId: SubscriptionID
    activeMembers: [PlanMember]! # also include owner, does NOT include self
    isOwner: Boolean!
    owner: PlanOwner!
    nextBillDate: Date!
  }

  type Notification {
    id: ID!
    subject: String!
    content: String!
    createdAt: DateTime!
  }

  type RetrieveNotifications {
    count: Int!
    notifications: [Notification]!
  }

  type SuccessfulPaymentData {
    planId: PlanID!
    planName: String!
    personalCost: USCurrency!
    cycleFrequency: CycleFrequency!
    nextBillDate: Date!
    paymentMethod: PaymentMethod!
  }

  type CreatePlanResponse {
    planId: PlanID!
    planName: String!
    cycleFrequency: CycleFrequency!
    startDate: Date!
    perCycleCost: USCurrency!
  }

  type Mutation {
    createUser(
      firstName: String!
      lastName: String!
      username: String!
      # username: Username!
      password: String!
      email: Email!
      testClockId: TestClockID # for testing purposes, not for production
    ): Boolean!

    login(
      usernameOrEmail: String!
      # username: Username!
      password: String!
    ): LoginInfo

    resetPassword(usernameOrEmail: String!): Boolean!

    resetPasswordFromToken(token: String!, newPassword: String!): LoginInfo!

    resendVerificationEmail(email: Email!, testClockId: TestClockID): Boolean!

    changeEmail(newEmail: Email!, password: String!): Boolean!

    changeUsername(newUsername: String!, password: String!): LoginInfo!

    changePassword(currentPassword: String!, newPassword: String!): Boolean!

    createPlan(
      planName: String!
      cycleFrequency: CycleFrequency!
      perCycleCost: USCurrency!
      startDate: Date!
    ): CreatePlanResponse!

    editPayment: PortalSession!

    unsubscribe(subscriptionId: SubscriptionID!): PlanIdResponse!

    unsubscribeAsOwner(
      subscriptionId: SubscriptionID!
      newOwner: String!
      # newOwner: Username!
    ): PlanIdResponse!

    editQuantity(subscriptionId: SubscriptionID!, newQuantity: Int!): EditQuantResponse!

    deletePlan(planId: PlanID!): PlanIdResponse!

    cancelTransaction(setupIntentId: SetupIntentID!): Boolean!

    # need to change response type
    subscribeWithSavedCard(
      paymentMethodId: PaymentMethodID!
      setupIntentId: SetupIntentID!
      password: String!
      planId: PlanID!
    ): Boolean

    joinPlan(planId: PlanID!, quantity: Int!): PaymentIntentAndPaymentMethods! # returning client secret

    deleteNotification(notificationId: ID!): ID!

    transferOwnership(planId: PlanID!, newOwner: String!): TransferOwnershipResponse!
  }
`;
