import { PlusIcon } from "../Icons";

export default function AddUserColumn({ onAddUser }) {
  return (
    <div className="user-column user-column-add">
      <button className="add-user-btn" type="button" onClick={onAddUser}>
        <div className="add-user-avatar">
          <PlusIcon />
        </div>
        <span className="add-user-text">Add User</span>
      </button>
    </div>
  );
}
