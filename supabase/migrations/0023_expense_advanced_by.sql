-- Add advanced_by_user_id to finance_transactions for tracking who paid out-of-pocket
ALTER TABLE finance_transactions
ADD COLUMN advanced_by_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN finance_transactions.advanced_by_user_id IS '代墊人（若是支出，且由特定隊員代墊，則記錄此欄位以便日後統計）';
